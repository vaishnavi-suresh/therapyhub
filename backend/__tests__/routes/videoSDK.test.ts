jest.mock('../../middleware/auth', () => ({
  checkJwt: (req: any, _res: any, next: any) => {
    if (!req.user) req.user = { sub: 'auth0|123', userId: 'therapist1', role: 'therapist' };
    next();
  },
  enrichUserFromDb: (req: any, res: any, next: any) => next(),
  requiredRoles: () => (req: any, res: any, next: any) => next(),
}));
jest.mock('../../api/controllers/videoSDKController');

import request from 'supertest';
import express from 'express';
import videoSDKRouter from '../../api/routes/videoSDK';
import * as controllers from '../../api/controllers/videoSDKController';

const app = express();
app.use(express.json());
app.use('/videosdk', videoSDKRouter);

describe('videoSDK routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /token calls generateTokenController', async () => {
    jest.mocked(controllers.generateTokenController).mockImplementation(async (req, res) => {
      res.json({ token: 'mock-token' });
    });

    const res = await request(app)
      .post('/videosdk/token')
      .send({ roomId: 'room1' });

    expect(res.status).toBe(200);
    expect(controllers.generateTokenController).toHaveBeenCalled();
  });

  it('POST /meeting calls createMeetingController', async () => {
    jest.mocked(controllers.createMeetingController).mockImplementation(async (req, res) => {
      res.json({ meetingId: 'room1', token: 'token1' });
    });

    const res = await request(app)
      .post('/videosdk/meeting')
      .send({ client_id: 'client1' });

    expect(res.status).toBe(200);
    expect(controllers.createMeetingController).toHaveBeenCalled();
  });

  it('GET /meeting/:meetingId/validate calls validateMeetingController', async () => {
    jest.mocked(controllers.validateMeetingController).mockImplementation(async (req, res) => {
      res.json({ valid: true });
    });

    const res = await request(app)
      .get('/videosdk/meeting/room123/validate');

    expect(res.status).toBe(200);
    expect(controllers.validateMeetingController).toHaveBeenCalled();
  });
});
