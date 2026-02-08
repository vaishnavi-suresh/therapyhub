import { Request, Response } from 'express';
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../api/services/meeting_recordings');
jest.mock('../../api/services/transcription');
jest.mock('../../utils/genAI');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('../../api/services/meetingSession');

import {
  uploadMeetingRecordingController,
  createMeetingRecordingController,
  getAllMeetingDataController,
  getMeetingDataController,
  updateMeetingDataController,
  deleteMeetingDataController,
  startSessionController,
  getActiveSessionController,
  manualSaveRecordingController,
} from '../../api/controllers/meetingRecordings';
import * as meetingRecordingsService from '../../api/services/meeting_recordings';
import * as meetingSession from '../../api/services/meetingSession';

// Mock fetch globally
global.fetch = jest.fn();

function mockRequest(overrides: Partial<Request> = {}): Request {
  return { params: {}, body: {}, ...overrides } as Request;
}

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Meeting Recordings Controller', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.S3_BUCKET_NAME = 'test-bucket';
    process.env.AWS_REGION = 'us-east-1';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createMeetingRecordingController', () => {
    it('should create meeting recording', async () => {
      const mockRecording = { meeting_id: 'mock-uuid', user_id: 'user1' };
      jest.mocked(meetingRecordingsService.createMeetingRecording).mockResolvedValue(mockRecording as any);

      const req = mockRequest({
        body: { user_id: 'user1', therapist_id: 'therapist1' },
      });
      const res = mockResponse();

      await createMeetingRecordingController(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockRecording);
    });
  });

  describe('getAllMeetingDataController', () => {
    it('should get all recordings with signed URLs', async () => {
      const mockRecordings = [
        { meeting_id: '1', recording_url: 'https://bucket.s3.region.amazonaws.com/key1' },
        { meeting_id: '2', recording_url: 'https://bucket.s3.region.amazonaws.com/key2' },
      ];
      jest.mocked(meetingRecordingsService.getMeetingRecordings).mockResolvedValue(mockRecordings as any);

      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      getSignedUrl.mockResolvedValue('signed-url-1');

      const req = mockRequest({ params: { user_id: 'user1', therapist_id: 'therapist1' } });
      const res = mockResponse();

      await getAllMeetingDataController(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should return error if params missing', async () => {
      const req = mockRequest({ params: {} });
      const res = mockResponse();

      await getAllMeetingDataController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getMeetingDataController', () => {
    it('should get single recording with signed URL', async () => {
      const mockRecording = {
        meeting_id: '1',
        recording_url: 'https://bucket.s3.region.amazonaws.com/key1',
      };
      jest.mocked(meetingRecordingsService.getMeetingRecording).mockResolvedValue(mockRecording as any);

      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      getSignedUrl.mockResolvedValue('signed-url');

      const req = mockRequest({ params: { meeting_recording_id: '1' } });
      const res = mockResponse();

      await getMeetingDataController(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should return 404 if recording not found', async () => {
      jest.mocked(meetingRecordingsService.getMeetingRecording).mockResolvedValue(null);

      const req = mockRequest({ params: { meeting_recording_id: '1' } });
      const res = mockResponse();

      await getMeetingDataController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateMeetingDataController', () => {
    it('should update recording', async () => {
      const mockResult = { modifiedCount: 1 };
      jest.mocked(meetingRecordingsService.updateMeetingRecording).mockResolvedValue(mockResult as any);

      const req = mockRequest({
        params: { meeting_recording_id: '1' },
        body: { transcript: 'test', analysis: 'test' },
      });
      const res = mockResponse();

      await updateMeetingDataController(req, res);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('deleteMeetingDataController', () => {
    it('should delete recording', async () => {
      const mockResult = { deletedCount: 1 };
      jest.mocked(meetingRecordingsService.deleteMeetingRecording).mockResolvedValue(mockResult as any);

      const req = mockRequest({ params: { meeting_recording_id: '1' } });
      const res = mockResponse();

      await deleteMeetingDataController(req, res);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('startSessionController', () => {
    it('should start session successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ roomId: 'room123' }),
      });

      jest.mocked(meetingSession.setSession).mockImplementation(() => {});

      const req = mockRequest({
        body: { user_id: 'user1' },
        user: { userId: 'therapist1' },
      } as any);
      const res = mockResponse();

      await startSessionController(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should return error if missing params', async () => {
      const req = mockRequest({ user: null } as any);
      const res = mockResponse();

      await startSessionController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getActiveSessionController', () => {
    it('should get active session', async () => {
      jest.mocked(meetingSession.getSessionByParticipants).mockReturnValue('room123');

      const req = mockRequest({
        query: { user_id: 'user1', therapist_id: 'therapist1' },
        user: { userId: 'therapist1' },
      } as any);
      const res = mockResponse();

      await getActiveSessionController(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should return null if no session', async () => {
      jest.mocked(meetingSession.getSessionByParticipants).mockReturnValue(undefined);

      const req = mockRequest({
        query: { user_id: 'user1', therapist_id: 'therapist1' },
        user: { userId: 'therapist1' },
      } as any);
      const res = mockResponse();

      await getActiveSessionController(req, res);

      expect(res.json).toHaveBeenCalledWith({ roomId: null, token: null });
    });
  });

  describe('manualSaveRecordingController', () => {
    it('should save recording manually', async () => {
      jest.mocked(meetingSession.getSession).mockReturnValue({
        user_id: 'user1',
        therapist_id: 'therapist1',
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('video data')),
          headers: new Headers({ 'content-type': 'video/mp4' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ data: [{ id: 'rec1' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ file: { fileUrl: 'https://example.com/video.mp4' } }),
        });

      const { S3Client } = require('@aws-sdk/client-s3');
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.mockImplementation(() => ({ send: mockSend }));

      jest.mocked(meetingRecordingsService.createMeetingRecording).mockResolvedValue({
        meeting_id: 'mock-uuid',
      } as any);

      const req = mockRequest({
        body: { meetingId: 'room123', fileUrl: 'https://example.com/video.mp4' },
      });
      const res = mockResponse();

      await manualSaveRecordingController(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Recording saved successfully' });
    });

    it('should return error if missing params', async () => {
      const req = mockRequest({ body: {} });
      const res = mockResponse();

      await manualSaveRecordingController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle session not found error', async () => {
      jest.mocked(meetingSession.getSession).mockReturnValue(undefined);

      const req = mockRequest({
        body: { meetingId: 'room123', fileUrl: 'https://example.com/video.mp4' },
      });
      const res = mockResponse();

      await manualSaveRecordingController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle S3 bucket not configured', async () => {
      delete process.env.S3_BUCKET_NAME;
      jest.mocked(meetingSession.getSession).mockReturnValue({
        user_id: 'user1',
        therapist_id: 'therapist1',
      });

      const req = mockRequest({
        body: { meetingId: 'room123', fileUrl: 'https://example.com/video.mp4' },
      });
      const res = mockResponse();

      await manualSaveRecordingController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('uploadMeetingRecordingController', () => {
    it('should upload recording with file', async () => {
      const { S3Client } = require('@aws-sdk/client-s3');
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.mockImplementation(() => ({ send: mockSend }));

      jest.mocked(meetingRecordingsService.createMeetingRecording).mockResolvedValue({
        meeting_id: 'mock-uuid',
      } as any);

      const req = mockRequest({
        params: { user_id: 'user1', therapist_id: 'therapist1' },
        file: {
          buffer: Buffer.from('video data'),
          mimetype: 'video/mp4',
        },
      } as any);
      const res = mockResponse();

      await uploadMeetingRecordingController(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return error if file missing', async () => {
      const req = mockRequest({
        params: { user_id: 'user1', therapist_id: 'therapist1' },
        file: undefined,
      } as any);
      const res = mockResponse();

      await uploadMeetingRecordingController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
