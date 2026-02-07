import { Request, Response } from 'express';
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../api/services/conversations');

import {
  getConversationController,
  createConversationController,
  updateConversationController,
  deleteConversationController,
} from '../../api/controllers/conversationsController';
import * as conversationsService from '../../api/services/conversations';

function mockRequest(overrides: Partial<Request> = {}): Request {
  return { params: {}, body: {}, ...overrides } as Request;
}

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('conversationsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConversationController', () => {
    it('returns conversation by id', async () => {
      const conv = { conversation_id: 'c-1', user_id: 'u-1' };
      const req = mockRequest({ params: { conversation_id: 'c-1' } });
      const res = mockResponse();
      jest.mocked(conversationsService.getConversation).mockResolvedValue(conv as any);
      await getConversationController(req, res);
      expect(conversationsService.getConversation).toHaveBeenCalledWith('c-1');
      expect(res.json).toHaveBeenCalledWith(conv);
    });
  });

  describe('createConversationController', () => {
    it('creates conversation and returns result', async () => {
      const req = mockRequest({
        body: { user_id: 'u-1', therapist_id: 't-1' },
      });
      const res = mockResponse();
      jest.mocked(conversationsService.createConversation).mockResolvedValue('new-id' as any);
      await createConversationController(req, res);
      expect(conversationsService.createConversation).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith('new-id');
    });
  });

  describe('updateConversationController', () => {
    it('updates conversation and returns result', async () => {
      const req = mockRequest({
        params: { conversation_id: 'c-1' },
        body: { user_id: 'u-1', therapist_id: 't-1' },
      });
      const res = mockResponse();
      jest.mocked(conversationsService.updateConversation).mockResolvedValue(1);
      await updateConversationController(req, res);
      expect(conversationsService.updateConversation).toHaveBeenCalledWith('c-1', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteConversationController', () => {
    it('deletes conversation and returns result', async () => {
      const req = mockRequest({ params: { conversation_id: 'c-1' } });
      const res = mockResponse();
      jest.mocked(conversationsService.deleteConversation).mockResolvedValue(1);
      await deleteConversationController(req, res);
      expect(conversationsService.deleteConversation).toHaveBeenCalledWith('c-1');
      expect(res.json).toHaveBeenCalledWith(1);
    });
  });
});
