import { Request, Response } from 'express';
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../api/services/therabot_conversations');

jest.mock('../../api/services/users', () => ({
  getUser: jest.fn(),
  getUserByExternalAuthId: jest.fn(),
}));

import {
  getTherabotConversationController,
  createTherabotConversationController,
  updateTherabotConversationController,
  deleteTherabotConversationController,
  getClientTherabotConversationsController,
  getMyTherabotConversationsController,
  closeTherabotConversationController,
} from '../../api/controllers/therabotConversationsController';
import * as therabotConversationsService from '../../api/services/therabot_conversations';
import * as usersService from '../../api/services/users';

function mockRequest(overrides: Partial<Request> = {}): Request {
  return { params: {}, body: {}, ...overrides } as Request;
}

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('therabotConversationsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTherabotConversationController', () => {
    it('returns conversation by id', async () => {
      const conv = { conversation_id: 'c-1', user_id: 'u-1' };
      const req = mockRequest({ params: { conversation_id: 'c-1' } });
      const res = mockResponse();
      jest.mocked(therabotConversationsService.getTherabotConversation).mockResolvedValue(conv as any);
      await getTherabotConversationController(req, res);
      expect(therabotConversationsService.getTherabotConversation).toHaveBeenCalledWith('c-1');
      expect(res.json).toHaveBeenCalledWith(conv);
    });
  });

  describe('createTherabotConversationController', () => {
    it('creates conversation and returns result', async () => {
      const req = mockRequest({
        body: { user_id: 'u-1', therapist_id: 't-1' },
      });
      const res = mockResponse();
      jest.mocked(therabotConversationsService.createTherabotConversation).mockResolvedValue('new-id' as any);
      await createTherabotConversationController(req, res);
      expect(therabotConversationsService.createTherabotConversation).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ conversation_id: 'mock-uuid', user_id: 'u-1', therapist_id: 't-1' }));
    });
  });

  describe('updateTherabotConversationController', () => {
    it('updates conversation and returns result', async () => {
      const conv = { conversation_id: 'c-1', user_id: 'u-1' };
      const req = mockRequest({
        params: { conversation_id: 'c-1' },
        body: { user_id: 'u-1', therapist_id: 't-1' },
      });
      const res = mockResponse();
      jest.mocked(therabotConversationsService.getTherabotConversation).mockResolvedValue(conv as any);
      await updateTherabotConversationController(req, res);
      expect(therabotConversationsService.updateTherabotConversation).toHaveBeenCalledWith('c-1', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(conv);
    });
  });

  describe('deleteTherabotConversationController', () => {
    it('deletes conversation and returns result', async () => {
      const req = mockRequest({ params: { conversation_id: 'c-1' } });
      const res = mockResponse();
      jest.mocked(therabotConversationsService.deleteTherabotConversation).mockResolvedValue(1);
      await deleteTherabotConversationController(req, res);
      expect(therabotConversationsService.deleteTherabotConversation).toHaveBeenCalledWith('c-1');
      expect(res.json).toHaveBeenCalledWith(1);
    });
  });

  describe('getClientTherabotConversationsController', () => {
    it('returns 401 when therapist not authenticated', async () => {
      const req = mockRequest({ params: { user_id: 'c-1' } });
      (req as any).user = {};
      const res = mockResponse();
      await getClientTherabotConversationsController(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('returns conversations for client', async () => {
      const convs = [{ conversation_id: 'c-1' }];
      const req = mockRequest({ params: { user_id: 'client-1' } });
      (req as any).user = { userId: 't-1' };
      const res = mockResponse();
      jest.mocked(usersService.getUser).mockResolvedValue({ user_id: 'client-1', therapist_id: 't-1' } as any);
      jest.mocked(therabotConversationsService.getTherabotConversationsByUserId).mockResolvedValue(convs as any);
      await getClientTherabotConversationsController(req, res);
      expect(therabotConversationsService.getTherabotConversationsByUserId).toHaveBeenCalledWith('client-1');
      expect(res.json).toHaveBeenCalledWith(convs);
    });

    it('returns 403 when client belongs to different therapist', async () => {
      const req = mockRequest({ params: { user_id: 'client-1' } });
      (req as any).user = { userId: 't-1' };
      const res = mockResponse();
      jest.mocked(usersService.getUser).mockResolvedValue({ user_id: 'client-1', therapist_id: 't-other' } as any);
      await getClientTherabotConversationsController(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    });

    it('returns 403 when client not found', async () => {
      const req = mockRequest({ params: { user_id: 'client-1' } });
      (req as any).user = { userId: 't-1' };
      const res = mockResponse();
      jest.mocked(usersService.getUser).mockResolvedValue(null);
      await getClientTherabotConversationsController(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    });
  });

  describe('getMyTherabotConversationsController', () => {
    it('returns 401 when sub is missing', async () => {
      const req = mockRequest();
      (req as any).user = {};
      const res = mockResponse();
      await getMyTherabotConversationsController(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('returns conversations for user', async () => {
      const convs = [{ conversation_id: 'c-1' }];
      const req = mockRequest();
      (req as any).user = { sub: 'auth0|123' };
      const res = mockResponse();
      jest.mocked(usersService.getUserByExternalAuthId).mockResolvedValue({ user_id: 'u-1' } as any);
      jest.mocked(therabotConversationsService.getTherabotConversationsByUserId).mockResolvedValue(convs as any);
      await getMyTherabotConversationsController(req, res);
      expect(usersService.getUserByExternalAuthId).toHaveBeenCalledWith('auth0|123');
      expect(therabotConversationsService.getTherabotConversationsByUserId).toHaveBeenCalledWith('u-1');
      expect(res.json).toHaveBeenCalledWith(convs);
    });

    it('returns 404 when user not found', async () => {
      const req = mockRequest();
      (req as any).user = { sub: 'auth0|123' };
      const res = mockResponse();
      jest.mocked(usersService.getUserByExternalAuthId).mockResolvedValue(null);
      await getMyTherabotConversationsController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('closeTherabotConversationController', () => {
    it('returns 401 when userId is missing', async () => {
      const req = mockRequest({ params: { conversation_id: 'c-1' } });
      (req as any).user = {};
      const res = mockResponse();
      await closeTherabotConversationController(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('returns 404 when conversation not found', async () => {
      const req = mockRequest({ params: { conversation_id: 'c-1' } });
      (req as any).user = { userId: 'u-1' };
      const res = mockResponse();
      jest.mocked(therabotConversationsService.getTherabotConversation).mockResolvedValue(null);
      await closeTherabotConversationController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Conversation not found' });
    });

    it('returns 403 when user does not own conversation', async () => {
      const req = mockRequest({ params: { conversation_id: 'c-1' } });
      (req as any).user = { userId: 'u-other' };
      const res = mockResponse();
      jest.mocked(therabotConversationsService.getTherabotConversation).mockResolvedValue({ user_id: 'u-1' } as any);
      await closeTherabotConversationController(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    });

    it('returns 400 when conversation already closed', async () => {
      const req = mockRequest({ params: { conversation_id: 'c-1' } });
      (req as any).user = { userId: 'u-1' };
      const res = mockResponse();
      jest.mocked(therabotConversationsService.getTherabotConversation).mockResolvedValue({ user_id: 'u-1', status: 'closed' } as any);
      await closeTherabotConversationController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Conversation already closed' });
    });

    it('returns 400 when conversation has care_plan_id (legacy)', async () => {
      const req = mockRequest({ params: { conversation_id: 'c-1' } });
      (req as any).user = { userId: 'u-1' };
      const res = mockResponse();
      jest.mocked(therabotConversationsService.getTherabotConversation).mockResolvedValue({ user_id: 'u-1', care_plan_id: 'cp-1' } as any);
      await closeTherabotConversationController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Conversation already closed' });
    });

    it('closes conversation successfully', async () => {
      const req = mockRequest({ params: { conversation_id: 'c-1' } });
      (req as any).user = { userId: 'u-1' };
      const res = mockResponse();
      jest.mocked(therabotConversationsService.getTherabotConversation).mockResolvedValue({ user_id: 'u-1', status: 'open' } as any);
      jest.mocked(therabotConversationsService.updateTherabotConversation).mockResolvedValue(1);
      await closeTherabotConversationController(req, res);
      expect(therabotConversationsService.updateTherabotConversation).toHaveBeenCalledWith('c-1', expect.objectContaining({ status: 'closed' }));
      expect(res.json).toHaveBeenCalledWith({ conversationClosed: true });
    });
  });
});
