jest.mock('../../middleware/auth', () => ({
  checkJwt: (req: any, _res: any, next: any) => {
    if (!req.user) req.user = { sub: 'auth0|123', userId: 'user1', role: 'therapist' };
    next();
  },
  enrichUserFromDb: (req: any, res: any, next: any) => next(),
  requiredRoles: () => (req: any, res: any, next: any) => next(),
  requiredRoleIn: () => (req: any, res: any, next: any) => next(),
  requiredUserId: (req: any, res: any, next: any) => next(),
  requiredTherapistId: (req: any, res: any, next: any) => next(),
}));
jest.mock('../../api/controllers/meetingRecordings');

import request from 'supertest';
import express from 'express';
import { meetingRecordingsRouter } from '../../api/routes/meeting_recording';
import * as controllers from '../../api/controllers/meetingRecordings';

const app = express();
app.use(express.json());
app.use('/meeting_recordings', meetingRecordingsRouter);

describe('meeting_recordings routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /session/start calls startSessionController', async () => {
    jest.mocked(controllers.startSessionController).mockImplementation(async (req, res) => {
      res.json({ meetingId: 'room1', token: 'token1' });
    });

    const res = await request(app)
      .post('/meeting_recordings/session/start')
      .send({ user_id: 'user1' });

    expect(res.status).toBe(200);
    expect(controllers.startSessionController).toHaveBeenCalled();
  });

  it('GET /session/active calls getActiveSessionController', async () => {
    jest.mocked(controllers.getActiveSessionController).mockImplementation(async (req, res) => {
      res.json({ roomId: 'room1', token: 'token1' });
    });

    const res = await request(app)
      .get('/meeting_recordings/session/active?user_id=user1&therapist_id=therapist1');

    expect(res.status).toBe(200);
    expect(controllers.getActiveSessionController).toHaveBeenCalled();
  });

  it('POST /manual-save calls manualSaveRecordingController', async () => {
    jest.mocked(controllers.manualSaveRecordingController).mockImplementation(async (req, res) => {
      res.json({ message: 'Saved' });
    });

    const res = await request(app)
      .post('/meeting_recordings/manual-save')
      .send({ meetingId: 'room1', fileUrl: 'https://example.com/video.mp4' });

    expect(res.status).toBe(200);
    expect(controllers.manualSaveRecordingController).toHaveBeenCalled();
  });

  it('POST /:user_id/:therapist_id calls createMeetingRecordingController', async () => {
    jest.mocked(controllers.createMeetingRecordingController).mockImplementation(async (req, res) => {
      res.status(201).json({ meeting_id: 'mock-uuid' });
    });

    const res = await request(app)
      .post('/meeting_recordings/user1/therapist1')
      .send({ recording_url: 'https://example.com/video.mp4' });

    expect(res.status).toBe(201);
    expect(controllers.createMeetingRecordingController).toHaveBeenCalled();
  });

  it('GET /:user_id/:therapist_id calls getAllMeetingDataController', async () => {
    jest.mocked(controllers.getAllMeetingDataController).mockImplementation(async (req, res) => {
      res.json([]);
    });

    const res = await request(app)
      .get('/meeting_recordings/user1/therapist1');

    expect(res.status).toBe(200);
    expect(controllers.getAllMeetingDataController).toHaveBeenCalled();
  });

  it('GET /:user_id/:therapist_id/:meeting_recording_id calls getMeetingDataController', async () => {
    jest.mocked(controllers.getMeetingDataController).mockImplementation(async (req, res) => {
      res.json({ meeting_id: '1' });
    });

    const res = await request(app)
      .get('/meeting_recordings/user1/therapist1/recording1');

    expect(res.status).toBe(200);
    expect(controllers.getMeetingDataController).toHaveBeenCalled();
  });

  it('DELETE /:user_id/:therapist_id/:meeting_recording_id calls deleteMeetingDataController', async () => {
    jest.mocked(controllers.deleteMeetingDataController).mockImplementation(async (req, res) => {
      res.json({ deletedCount: 1 });
    });

    const res = await request(app)
      .delete('/meeting_recordings/user1/therapist1/recording1');

    expect(res.status).toBe(200);
    expect(controllers.deleteMeetingDataController).toHaveBeenCalled();
  });
});
