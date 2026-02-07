jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../middleware/auth', () => ({
  checkJwt: (req: any, res: any, next: any) => next(),
  requiredRoles: () => (req: any, res: any, next: any) => next(),
  requiredUserId: (req: any, res: any, next: any) => next(),
  requireUserOrTherapist: (req: any, res: any, next: any) => next(),
}));
jest.mock('../../api/services/conversations');

import request from 'supertest';
import express from 'express';
import conversationRouter from '../../api/routes/conversations';

const app = express();
app.use(express.json());
app.use(conversationRouter);

import * as conversationsService from '../../api/services/conversations';

describe('conversations routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /:conversation_id returns conversation', async () => {
    const conv = { conversation_id: 'c-1', user_id: 'u-1' };
    jest.mocked(conversationsService.getConversation).mockResolvedValue(conv as any);
    const res = await request(app).get('/c-1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(conv);
  });

  it('POST / creates conversation', async () => {
    jest.mocked(conversationsService.createConversation).mockResolvedValue('new-id' as any);
    const res = await request(app)
      .post('/')
      .send({ user_id: 'u-1', therapist_id: 't-1' });
    expect(res.status).toBe(200);
    expect(conversationsService.createConversation).toHaveBeenCalled();
  });

  it('PUT /:conversation_id updates conversation', async () => {
    jest.mocked(conversationsService.updateConversation).mockResolvedValue(1);
    const res = await request(app)
      .put('/c-1')
      .send({ user_id: 'u-1', therapist_id: 't-1' });
    expect(res.status).toBe(200);
    expect(conversationsService.updateConversation).toHaveBeenCalledWith('c-1', expect.any(Object));
  });

  it('DELETE /:conversation_id deletes conversation', async () => {
    jest.mocked(conversationsService.deleteConversation).mockResolvedValue(1);
    const res = await request(app).delete('/c-1');
    expect(res.status).toBe(200);
    expect(conversationsService.deleteConversation).toHaveBeenCalledWith('c-1');
  });
});
