import { Request, Response, NextFunction } from 'express';
import { requiredRoles, requiredUserId, requireUserOrTherapist } from '../../middleware/auth';

jest.mock('../../api/services/users', () => ({
  getUser: jest.fn(),
}));

import { getUser } from '../../api/services/users';

let mockNext: NextFunction;

function mockRequest(overrides: Partial<Request> = {}): Request {
  return { params: {}, ...overrides } as Request;
}

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  mockNext = jest.fn();
});

describe('requiredRoles', () => {
  it('calls next when user role matches', () => {
    const req = mockRequest({ user: { role: 'user' } });
    const res = mockResponse();
    const middleware = requiredRoles('user');
    middleware(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when user role does not match', () => {
    const req = mockRequest({ user: { role: 'user' } });
    const res = mockResponse();
    const middleware = requiredRoles('therapist');
    middleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 403 when user is undefined', () => {
    const req = mockRequest({ user: undefined });
    const res = mockResponse();
    const middleware = requiredRoles('user');
    middleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe('requiredUserId', () => {
  it('calls next when params.user_id matches user.userId', () => {
    const req = mockRequest({
      params: { user_id: 'u-123' },
      user: { userId: 'u-123' },
    });
    const res = mockResponse();
    requiredUserId(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when params.user_id does not match user.userId', () => {
    const req = mockRequest({
      params: { user_id: 'u-other' },
      user: { userId: 'u-123' },
    });
    const res = mockResponse();
    requiredUserId(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Forbidden: access restricted to the user',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 403 when user.userId is missing', () => {
    const req = mockRequest({
      params: { user_id: 'u-123' },
      user: {},
    });
    const res = mockResponse();
    requiredUserId(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe('requireUserOrTherapist', () => {
  beforeEach(() => {
    jest.mocked(getUser).mockReset();
  });

  it('calls next when user is accessing their own info', async () => {
    const req = mockRequest({
      params: { user_id: 'u-123' },
      user: { userId: 'u-123' },
    });
    const res = mockResponse();
    await requireUserOrTherapist(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(getUser).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next when therapist is accessing their client', async () => {
    const req = mockRequest({
      params: { user_id: 'u-client' },
      user: { userId: 'u-therapist' },
    });
    const res = mockResponse();
    jest.mocked(getUser).mockResolvedValue({
      user_id: 'u-client',
      therapist_id: 'u-therapist',
    } as any);
    await requireUserOrTherapist(req, res, mockNext);
    expect(getUser).toHaveBeenCalledWith('u-client');
    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when auth user is missing', async () => {
    const req = mockRequest({
      params: { user_id: 'u-123' },
      user: undefined,
    });
    const res = mockResponse();
    await requireUserOrTherapist(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 403 when requester is not user or therapist', async () => {
    const req = mockRequest({
      params: { user_id: 'u-client' },
      user: { userId: 'u-other' },
    });
    const res = mockResponse();
    jest.mocked(getUser).mockResolvedValue({
      user_id: 'u-client',
      therapist_id: 'u-therapist',
    } as any);
    await requireUserOrTherapist(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Forbidden: access restricted to the user or their therapist',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 403 when requested user has no therapist_id match', async () => {
    const req = mockRequest({
      params: { user_id: 'u-client' },
      user: { userId: 'u-other' },
    });
    const res = mockResponse();
    jest.mocked(getUser).mockResolvedValue({
      user_id: 'u-client',
      therapist_id: null,
    } as any);
    await requireUserOrTherapist(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 403 when getUser throws', async () => {
    const req = mockRequest({
      params: { user_id: 'u-client' },
      user: { userId: 'u-therapist' },
    });
    const res = mockResponse();
    jest.mocked(getUser).mockRejectedValue(new Error('DB error'));
    await requireUserOrTherapist(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
