import { Request, Response } from 'express';
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../api/services/therabot_messages');
jest.mock('../../api/services/therabot_conversations');
jest.mock('../../utils/genAI', () => ({ createTherapistBotResponse: jest.fn().mockResolvedValue('Bot reply') }));

import {
  getTherabotMessagesController,
  getTherabotMessageController,
  createTherabotMessageController,
  updateTherabotMessageController,
  deleteTherabotMessageController,
} from '../../api/controllers/therabotMessagesController';
import * as therabotMessagesService from '../../api/services/therabot_messages';
import * as therabotConversationsService from '../../api/services/therabot_conversations';

function mockRequest(overrides: Partial<Request> = {}): Request {
  return { params: {}, body: {}, ...overrides } as Request;
}

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('therabotMessagesController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTherabotMessagesController', () => {
    it('returns messages for user and conversation', async () => {
      const messages = [{ message_id: 'm-1' }];
      const req = mockRequest({
        params: { user_id: 'u-1', conversation_id: 'c-1' },
      });
      const res = mockResponse();
      jest.mocked(therabotMessagesService.getTherabotMessages).mockResolvedValue(messages as any);
      await getTherabotMessagesController(req, res);
      expect(therabotMessagesService.getTherabotMessages).toHaveBeenCalledWith('u-1', 'c-1');
      expect(res.json).toHaveBeenCalledWith(messages);
    });
  });

  describe('getTherabotMessageController', () => {
    it('returns single message', async () => {
      const message = { message_id: 'm-1', message_content: 'hi' };
      const req = mockRequest({
        params: { user_id: 'u-1', conversation_id: 'c-1', message_id: 'm-1' },
      });
      const res = mockResponse();
      jest.mocked(therabotMessagesService.getTherabotMessage).mockResolvedValue(message as any);
      await getTherabotMessageController(req, res);
      expect(therabotMessagesService.getTherabotMessage).toHaveBeenCalledWith('u-1', 'c-1', 'm-1');
      expect(res.json).toHaveBeenCalledWith(message);
    });
  });

  describe('createTherabotMessageController', () => {
    it('creates message and returns result', async () => {
      const req = mockRequest({
        params: { user_id: 'u-1', conversation_id: 'c-1' },
        body: {
          message_content: 'Hello',
          role: 'user',
          therapist_id: 't-1',
        },
      });
      const res = mockResponse();
      jest.mocked(therabotConversationsService.getTherabotConversation).mockResolvedValue({ care_plan_id: null } as any);
      jest.mocked(therabotMessagesService.createTherabotMessage).mockResolvedValue('new-id' as any);
      jest.mocked(therabotMessagesService.getTherabotMessages).mockResolvedValue([
        { role: 'user', message_content: 'Hi' },
        { role: 'bot', message_content: 'Hello there' },
      ] as any);
      await createTherabotMessageController(req, res);
      expect(therabotMessagesService.createTherabotMessage).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ userMessage: expect.any(Object), botMessage: expect.any(Object) }));
    });

    it('returns 403 when conversation is closed (status)', async () => {
      const req = mockRequest({
        params: { user_id: 'u-1', conversation_id: 'c-1' },
        body: { message_content: 'Hi', role: 'user', therapist_id: 't-1' },
      });
      const res = mockResponse();
      jest.mocked(therabotConversationsService.getTherabotConversation).mockResolvedValue({ status: 'closed' } as any);
      await createTherabotMessageController(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cannot send messages to a closed conversation' });
      expect(therabotMessagesService.createTherabotMessage).not.toHaveBeenCalled();
    });

    it('returns 403 when conversation has care_plan_id (legacy)', async () => {
      const req = mockRequest({
        params: { user_id: 'u-1', conversation_id: 'c-1' },
        body: { message_content: 'Hi', role: 'user', therapist_id: 't-1' },
      });
      const res = mockResponse();
      jest.mocked(therabotConversationsService.getTherabotConversation).mockResolvedValue({ care_plan_id: 'cp-1' } as any);
      await createTherabotMessageController(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cannot send messages to a closed conversation' });
    });

    it('creates bot message directly when role is bot', async () => {
      const req = mockRequest({
        params: { user_id: 'u-1', conversation_id: 'c-1' },
        body: {
          message_content: 'Bot reply',
          role: 'bot',
          therapist_id: 't-1',
        },
      });
      const res = mockResponse();
      jest.mocked(therabotConversationsService.getTherabotConversation).mockResolvedValue({ status: 'open' } as any);
      jest.mocked(therabotMessagesService.createTherabotMessage).mockResolvedValue('new-id' as any);
      await createTherabotMessageController(req, res);
      expect(therabotMessagesService.createTherabotMessage).toHaveBeenCalledTimes(1);
      expect(therabotMessagesService.getTherabotMessages).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ role: 'bot', message_content: 'Bot reply' }));
    });

    it('uses fallback when genAI returns null', async () => {
      const req = mockRequest({
        params: { user_id: 'u-1', conversation_id: 'c-1' },
        body: { message_content: 'Hi', role: 'user', therapist_id: 't-1' },
      });
      const res = mockResponse();
      jest.mocked(therabotConversationsService.getTherabotConversation).mockResolvedValue({ status: 'open' } as any);
      jest.mocked(therabotMessagesService.createTherabotMessage).mockResolvedValue('new-id' as any);
      jest.mocked(therabotMessagesService.getTherabotMessages).mockResolvedValue([]);
      const genAI = require('../../utils/genAI');
      genAI.createTherapistBotResponse.mockResolvedValueOnce(null);
      await createTherabotMessageController(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        botMessage: expect.objectContaining({ message_content: "I'm here to listen. Could you tell me more?" }),
      }));
    });

    it('uses fallback message when genAI throws', async () => {
      const req = mockRequest({
        params: { user_id: 'u-1', conversation_id: 'c-1' },
        body: { message_content: 'Hi', role: 'user', therapist_id: 't-1' },
      });
      const res = mockResponse();
      jest.mocked(therabotConversationsService.getTherabotConversation).mockResolvedValue({ status: 'open' } as any);
      jest.mocked(therabotMessagesService.createTherabotMessage).mockResolvedValue('new-id' as any);
      jest.mocked(therabotMessagesService.getTherabotMessages).mockResolvedValue([]);
      const genAI = require('../../utils/genAI');
      genAI.createTherapistBotResponse.mockRejectedValueOnce(new Error('AI error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await createTherabotMessageController(req, res);
      consoleSpy.mockRestore();
      expect(therabotMessagesService.createTherabotMessage).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        botMessage: expect.objectContaining({ message_content: "I'm having trouble responding right now. Please try again in a moment." }),
      }));
    });
  });

  describe('updateTherabotMessageController', () => {
    it('updates message and returns result', async () => {
      const message = { message_id: 'm-1', message_content: 'Updated' };
      const req = mockRequest({
        params: { user_id: 'u-1', conversation_id: 'c-1', message_id: 'm-1' },
        body: { message_content: 'Updated' },
      });
      const res = mockResponse();
      jest.mocked(therabotMessagesService.getTherabotMessage).mockResolvedValue(message as any);
      await updateTherabotMessageController(req, res);
      expect(therabotMessagesService.updateTherabotMessage).toHaveBeenCalledWith('u-1', 'c-1', 'm-1', { message_content: 'Updated' });
      expect(res.json).toHaveBeenCalledWith(message);
    });
  });

  describe('deleteTherabotMessageController', () => {
    it('deletes message and returns result', async () => {
      const req = mockRequest({
        params: { user_id: 'u-1', conversation_id: 'c-1', message_id: 'm-1' },
      });
      const res = mockResponse();
      jest.mocked(therabotMessagesService.deleteTherabotMessage).mockResolvedValue(1);
      await deleteTherabotMessageController(req, res);
      expect(therabotMessagesService.deleteTherabotMessage).toHaveBeenCalledWith('u-1', 'c-1', 'm-1');
      expect(res.json).toHaveBeenCalledWith(1);
    });
  });
});
