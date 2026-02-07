import { Request, Response } from 'express';
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../api/services/message');

import {
  getMessagesController,
  getMessageController,
  createMessageController,
  updateMessageController,
  deleteMessageController,
} from '../../api/controllers/messageController';
import * as messageService from '../../api/services/message';

function mockRequest(overrides: Partial<Request> = {}): Request {
  return { params: {}, body: {}, ...overrides } as Request;
}

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('messageController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMessagesController', () => {
    it('returns messages for user and conversation', async () => {
      const messages = [{ message_id: 'm-1' }];
      const req = mockRequest({
        params: { user_id: 'u-1', conversation_id: 'c-1' },
      });
      const res = mockResponse();
      jest.mocked(messageService.getMessages).mockResolvedValue(messages as any);
      await getMessagesController(req, res);
      expect(messageService.getMessages).toHaveBeenCalledWith('u-1', 'c-1');
      expect(res.json).toHaveBeenCalledWith(messages);
    });
  });

  describe('getMessageController', () => {
    it('returns single message', async () => {
      const message = { message_id: 'm-1', message_content: 'hi' };
      const req = mockRequest({
        params: { user_id: 'u-1', conversation_id: 'c-1', message_id: 'm-1' },
      });
      const res = mockResponse();
      jest.mocked(messageService.getMessage).mockResolvedValue(message as any);
      await getMessageController(req, res);
      expect(messageService.getMessage).toHaveBeenCalledWith('u-1', 'c-1', 'm-1');
      expect(res.json).toHaveBeenCalledWith(message);
    });
  });

  describe('createMessageController', () => {
    it('creates message and returns result', async () => {
      const req = mockRequest({
        body: {
          user_id: 'u-1',
          conversation_id: 'c-1',
          message_content: 'Hello',
          role: 'user',
          therapist_id: 't-1',
        },
      });
      const res = mockResponse();
      jest.mocked(messageService.createMessage).mockResolvedValue('new-id' as any);
      await createMessageController(req, res);
      expect(messageService.createMessage).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith('new-id');
    });
  });

  describe('updateMessageController', () => {
    it('updates message and returns result', async () => {
      const req = mockRequest({
        params: { user_id: 'u-1', conversation_id: 'c-1', message_id: 'm-1' },
        body: { message_content: 'Updated' },
      });
      const res = mockResponse();
      jest.mocked(messageService.updateMessage).mockResolvedValue(1);
      await updateMessageController(req, res);
      expect(messageService.updateMessage).toHaveBeenCalledWith(
        'u-1',
        'c-1',
        'm-1',
        'Updated'
      );
      expect(res.json).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteMessageController', () => {
    it('deletes message and returns result', async () => {
      const req = mockRequest({
        params: { user_id: 'u-1', conversation_id: 'c-1', message_id: 'm-1' },
      });
      const res = mockResponse();
      jest.mocked(messageService.deleteMessage).mockResolvedValue(1);
      await deleteMessageController(req, res);
      expect(messageService.deleteMessage).toHaveBeenCalledWith('u-1', 'c-1', 'm-1');
      expect(res.json).toHaveBeenCalledWith(1);
    });
  });
});
