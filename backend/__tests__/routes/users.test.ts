jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../middleware/auth', () => ({
  checkJwt: (req: any, _res: any, next: any) => {
    if (!req.user) req.user = { sub: 'auth0|123' };
    next();
  },
  enrichUserFromDb: (req: any, res: any, next: any) => next(),
  requiredRoles: () => (req: any, res: any, next: any) => next(),
  requiredUserId: (req: any, res: any, next: any) => next(),
  requireUserOrTherapist: (req: any, res: any, next: any) => next(),
}));
jest.mock('../../api/services/users');

import request from 'supertest';
import express from 'express';
import userRouter from '../../api/routes/users';

const app = express();
app.use(express.json());
app.use(userRouter);

import * as usersService from '../../api/services/users';

describe('users routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /:user_id returns user', async () => {
    const user = { user_id: 'u-1', email: 'a@b.com' };
    jest.mocked(usersService.getUser).mockResolvedValue(user as any);
    const res = await request(app).get('/u-1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(user);
    expect(usersService.getUser).toHaveBeenCalledWith('u-1');
  });

  it('POST / creates user', async () => {
    jest.mocked(usersService.createUser).mockResolvedValue('new-id' as any);
    const res = await request(app)
      .post('/')
      .send({
        external_auth_id: 'auth0|1',
        email: 'a@b.com',
        first_name: 'J',
        last_name: 'D',
        role: 'user',
        therapist_id: null,
        client_ids: [],
      });
    expect(res.status).toBe(200);
    expect(usersService.createUser).toHaveBeenCalled();
  });

  it('PUT /:user_id updates user', async () => {
    jest.mocked(usersService.updateUser).mockResolvedValue(1);
    const res = await request(app)
      .put('/u-1')
      .send({
        external_auth_id: 'auth0|1',
        email: 'a@b.com',
        first_name: 'J',
        last_name: 'D',
        role: 'user',
        therapist_id: null,
        client_ids: [],
      });
    expect(res.status).toBe(200);
    expect(usersService.updateUser).toHaveBeenCalledWith('u-1', expect.any(Object));
  });

  it('DELETE /:user_id deletes user', async () => {
    jest.mocked(usersService.deleteUser).mockResolvedValue(1);
    const res = await request(app).delete('/u-1');
    expect(res.status).toBe(200);
    expect(usersService.deleteUser).toHaveBeenCalledWith('u-1');
  });

  it('GET /me returns current user', async () => {
    const user = { user_id: 'u-1', external_auth_id: 'auth0|123' };
    jest.mocked(usersService.getUserByExternalAuthId).mockResolvedValue(user as any);
    const res = await request(app).get('/me');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(user);
  });

  it('GET /therapists returns therapists', async () => {
    const therapists = [{ user_id: 't-1', role: 'therapist', email: 't@b.com' }];
    jest.mocked(usersService.getAllTherapists).mockResolvedValue(therapists as any);
    const res = await request(app).get('/therapists');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(therapists);
    expect(usersService.getAllTherapists).toHaveBeenCalled();
  });

  it('GET /therapists/:email returns therapist by email', async () => {
    const therapist = { user_id: 't-1', email: 'therapist@b.com', role: 'therapist' };
    jest.mocked(usersService.getTherapistByEmail).mockResolvedValue(therapist as any);
    const res = await request(app).get('/therapists/therapist%40b.com');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(therapist);
    expect(usersService.getTherapistByEmail).toHaveBeenCalledWith('therapist@b.com');
  });

  it('POST /therapists/add-client adds client to therapist', async () => {
    jest.mocked(usersService.addClientToTherapist).mockResolvedValue({} as any);
    const res = await request(app)
      .post('/therapists/add-client')
      .send({ therapist_user_id: 't-1', client_user_id: 'c-1' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(usersService.addClientToTherapist).toHaveBeenCalledWith('t-1', 'c-1');
  });

  it('POST /therapists/add-client returns 400 when body incomplete', async () => {
    const res = await request(app)
      .post('/therapists/add-client')
      .send({ therapist_user_id: 't-1' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'therapist_user_id and client_user_id are required' });
  });
});
