import { Request, Response } from 'express';
import {
  generateTokenController,
  createMeetingController,
  validateMeetingController,
} from '../../api/controllers/videoSDKController';
import * as meetingSession from '../../api/services/meetingSession';

jest.mock('jsonwebtoken');
jest.mock('../../api/services/meetingSession');
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

// Mock fetch globally
global.fetch = jest.fn();

const jwt = require('jsonwebtoken');

function mockRequest(overrides: Partial<Request> = {}): Request {
  return { params: {}, body: {}, ...overrides } as Request;
}

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('VideoSDK Controller', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.VIDEOSDK_API_KEY = 'test-api-key';
    process.env.VIDEOSDK_SECRET = 'test-secret';
    jwt.sign = jest.fn(() => 'mock-token');
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('generateTokenController', () => {
    it('should generate token successfully', async () => {
      const req = mockRequest({
        body: { roomId: 'room1', permissions: ['allow_join'] },
      });
      const res = mockResponse();

      await generateTokenController(req, res);

      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ token: 'mock-token' });
    });

    it('should return error if credentials not configured', async () => {
      delete process.env.VIDEOSDK_API_KEY;
      const req = mockRequest();
      const res = mockResponse();

      await generateTokenController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'VideoSDK credentials not configured' });
    });

    it('should handle errors gracefully', async () => {
      jwt.sign.mockImplementation(() => {
        throw new Error('JWT error');
      });
      const req = mockRequest();
      const res = mockResponse();

      await generateTokenController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createMeetingController', () => {
    it('should create meeting successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ roomId: 'room123' }),
      });

      const req = mockRequest({
        body: { client_id: 'client1' },
        user: { userId: 'therapist1' },
      } as any);
      const res = mockResponse();

      await createMeetingController(req, res);

      expect(global.fetch).toHaveBeenCalled();
      expect(meetingSession.setSession).toHaveBeenCalledWith('room123', 'client1', 'therapist1');
      expect(res.json).toHaveBeenCalledWith({ meetingId: 'room123', token: 'mock-token' });
    });

    it('should return error if unauthorized', async () => {
      const req = mockRequest({ user: null } as any);
      const res = mockResponse();

      await createMeetingController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return error if credentials not configured', async () => {
      delete process.env.VIDEOSDK_API_KEY;
      const req = mockRequest({ user: { userId: 'therapist1' } } as any);
      const res = mockResponse();

      await createMeetingController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('validateMeetingController', () => {
    it('should validate meeting successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ roomId: 'room123' }),
      });

      const req = mockRequest({ 
        params: { meetingId: 'room123' },
        user: { userId: 'user1', role: 'user' },
      } as any);
      const res = mockResponse();

      await validateMeetingController(req, res);

      expect(res.json).toHaveBeenCalledWith({ 
        valid: true,
        meetingId: 'room123',
      });
    });

    it('should return invalid if meeting not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const req = mockRequest({ params: { meetingId: 'invalid' } });
      const res = mockResponse();

      await validateMeetingController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        valid: false,
        error: 'Meeting not found or invalid',
      });
    });
  });
});
