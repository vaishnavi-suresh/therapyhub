import { Request, Response } from 'express';
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../api/services/users');
jest.mock('../../api/services/therabot_conversations', () => ({
  getTherabotConversationsByUserId: jest.fn(),
}));

import {
  createUserController,
  updateUserController,
  deleteUserController,
  getUserController,
  getAllUsersController,
  getAllTherapistsController,
  getTherapistByEmailController,
  getMeController,
  addClientToTherapistController,
  getTherapistClientsController,
} from '../../api/controllers/userController';
import * as usersService from '../../api/services/users';
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

describe('userController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserController', () => {
    it('creates user and returns result', async () => {
      const req = mockRequest({
        body: {
          external_auth_id: 'auth0|1',
          email: 'a@b.com',
          first_name: 'Jane',
          last_name: 'Doe',
          role: 'user',
          therapist_id: null,
          client_ids: [],
        },
      });
      const res = mockResponse();
      jest.mocked(usersService.createUser).mockResolvedValue('new-id' as any);
      await createUserController(req, res);
      expect(usersService.createUser).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'mock-uuid',
          email: 'a@b.com',
          first_name: 'Jane',
          last_name: 'Doe',
          role: 'user',
        })
      );
    });
  });

  describe('updateUserController', () => {
    it('updates user and returns result', async () => {
      const req = mockRequest({
        params: { user_id: 'u-1' },
        body: {
          external_auth_id: 'auth0|1',
          email: 'a@b.com',
          first_name: 'Jane',
          last_name: 'Doe',
          role: 'user',
          therapist_id: null,
          client_ids: [],
        },
      });
      const res = mockResponse();
      jest.mocked(usersService.updateUser).mockResolvedValue(1);
      await updateUserController(req, res);
      expect(usersService.updateUser).toHaveBeenCalledWith('u-1', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteUserController', () => {
    it('deletes user and returns result', async () => {
      const req = mockRequest({ params: { user_id: 'u-1' } });
      const res = mockResponse();
      jest.mocked(usersService.deleteUser).mockResolvedValue(1);
      await deleteUserController(req, res);
      expect(usersService.deleteUser).toHaveBeenCalledWith('u-1');
      expect(res.json).toHaveBeenCalledWith(1);
    });
  });

  describe('getUserController', () => {
    it('gets user and returns result', async () => {
      const user = { user_id: 'u-1', email: 'a@b.com' };
      const req = mockRequest({ params: { user_id: 'u-1' } });
      const res = mockResponse();
      jest.mocked(usersService.getUser).mockResolvedValue(user as any);
      await getUserController(req, res);
      expect(usersService.getUser).toHaveBeenCalledWith('u-1');
      expect(res.json).toHaveBeenCalledWith(user);
    });
  });

  describe('getAllUsersController', () => {
    it('returns all users', async () => {
      const users = [{ user_id: 'u-1' }, { user_id: 'u-2' }];
      const req = mockRequest();
      const res = mockResponse();
      jest.mocked(usersService.getAllUsers).mockResolvedValue(users as any);
      await getAllUsersController(req, res);
      expect(usersService.getAllUsers).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(users);
    });
  });

  describe('getAllTherapistsController', () => {
    it('returns list of therapists', async () => {
      const therapists = [{ user_id: 't-1', role: 'therapist', email: 't@b.com' }];
      const req = mockRequest();
      const res = mockResponse();
      jest.mocked(usersService.getAllTherapists).mockResolvedValue(therapists as any);
      await getAllTherapistsController(req, res);
      expect(usersService.getAllTherapists).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(therapists);
    });
  });

  describe('getTherapistByEmailController', () => {
    it('returns therapist by email', async () => {
      const therapist = { user_id: 't-1', email: 'therapist@b.com', role: 'therapist' };
      const req = mockRequest({ params: { email: 'therapist@b.com' } });
      const res = mockResponse();
      jest.mocked(usersService.getTherapistByEmail).mockResolvedValue(therapist as any);
      await getTherapistByEmailController(req, res);
      expect(usersService.getTherapistByEmail).toHaveBeenCalledWith('therapist@b.com');
      expect(res.json).toHaveBeenCalledWith(therapist);
    });
  });

  describe('getMeController', () => {
    it('returns user when sub is present', async () => {
      const user = { user_id: 'u-1', external_auth_id: 'auth0|123', email: 'a@b.com' };
      const req = mockRequest();
      (req as any).user = { sub: 'auth0|123' };
      const res = mockResponse();
      jest.mocked(usersService.getUserByExternalAuthId).mockResolvedValue(user as any);
      await getMeController(req, res);
      expect(usersService.getUserByExternalAuthId).toHaveBeenCalledWith('auth0|123');
      expect(res.json).toHaveBeenCalledWith(user);
    });

    it('returns 401 when sub is missing', async () => {
      const req = mockRequest();
      (req as any).user = {};
      const res = mockResponse();
      await getMeController(req, res);
      expect(usersService.getUserByExternalAuthId).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });
  });

  describe('addClientToTherapistController', () => {
    it('adds client to therapist and returns success', async () => {
      const req = mockRequest({
        body: { therapist_user_id: 't-1', client_user_id: 'c-1' },
      });
      const res = mockResponse();
      jest.mocked(usersService.addClientToTherapist).mockResolvedValue({} as any);
      await addClientToTherapistController(req, res);
      expect(usersService.addClientToTherapist).toHaveBeenCalledWith('t-1', 'c-1');
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('returns 400 when therapist_user_id is missing', async () => {
      const req = mockRequest({ body: { client_user_id: 'c-1' } });
      const res = mockResponse();
      await addClientToTherapistController(req, res);
      expect(usersService.addClientToTherapist).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'therapist_user_id and client_user_id are required' });
    });

    it('returns 400 when client_user_id is missing', async () => {
      const req = mockRequest({ body: { therapist_user_id: 't-1' } });
      const res = mockResponse();
      await addClientToTherapistController(req, res);
      expect(usersService.addClientToTherapist).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'therapist_user_id and client_user_id are required' });
    });
  });

  describe('getTherapistClientsController', () => {
    it('returns 401 when userId is missing', async () => {
      const req = mockRequest();
      (req as any).user = {};
      const res = mockResponse();
      await getTherapistClientsController(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('returns clients with last_activity', async () => {
      const clients = [{ user_id: 'c-1', email: 'c@b.com' }];
      const convos = [{ conversation_updated_at: '2024-01-15T10:00:00Z' }];
      const req = mockRequest();
      (req as any).user = { userId: 't-1' };
      const res = mockResponse();
      jest.mocked(usersService.getClientsByTherapistId).mockResolvedValue(clients as any);
      jest.mocked(therabotConversationsService.getTherabotConversationsByUserId).mockResolvedValue(convos as any);
      await getTherapistClientsController(req, res);
      expect(usersService.getClientsByTherapistId).toHaveBeenCalledWith('t-1');
      expect(therabotConversationsService.getTherabotConversationsByUserId).toHaveBeenCalledWith('c-1');
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ user_id: 'c-1', last_activity: expect.any(String) }),
      ]));
    });

    it('returns clients sorted by last_activity with mixed null', async () => {
      const clients = [
        { user_id: 'c-1', email: 'a@b.com' },
        { user_id: 'c-2', email: 'b@b.com' },
        { user_id: 'c-3', email: 'c@b.com' },
      ];
      const req = mockRequest();
      (req as any).user = { userId: 't-1' };
      const res = mockResponse();
      jest.mocked(usersService.getClientsByTherapistId).mockResolvedValue(clients as any);
      jest.mocked(therabotConversationsService.getTherabotConversationsByUserId)
        .mockResolvedValueOnce([{ conversation_updated_at: '2024-01-20T10:00:00Z' }] as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ conversation_created_at: '2024-01-10T10:00:00Z' }] as any);
      await getTherapistClientsController(req, res);
      const result = (res.json as jest.Mock).mock.calls[0][0];
      expect(result[0].user_id).toBe('c-1');
      expect(result[1].user_id).toBe('c-3');
      expect(result[2].user_id).toBe('c-2');
    });

    it('returns clients with null last_activity when no conversations', async () => {
      const clients = [{ user_id: 'c-1', email: 'c@b.com' }];
      const req = mockRequest();
      (req as any).user = { userId: 't-1' };
      const res = mockResponse();
      jest.mocked(usersService.getClientsByTherapistId).mockResolvedValue(clients as any);
      jest.mocked(therabotConversationsService.getTherabotConversationsByUserId).mockResolvedValue([]);
      await getTherapistClientsController(req, res);
      expect(res.json).toHaveBeenCalledWith([{ ...clients[0], last_activity: null }]);
    });
  });
});
