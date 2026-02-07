jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../middleware/auth', () => ({
  checkJwt: (req: any, res: any, next: any) => next(),
  requiredRoles: () => (req: any, res: any, next: any) => next(),
  requiredUserId: (req: any, res: any, next: any) => next(),
}));
jest.mock('../../api/services/message');

import request from 'supertest';
import express from 'express';
import messageRouter from '../../api/routes/message';

const app = express();
app.use(express.json());
app.use(messageRouter);

import * as messageService from '../../api/services/message';

describe('message routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const basePath = '/u-1/c-1/messages';

  it('GET /:user_id/:conversation_id/messages returns messages', async () => {
    const messages = [{ message_id: 'm-1' }];
    jest.mocked(messageService.getMessages).mockResolvedValue(messages as any);
    const res = await request(app).get('/u-1/c-1/messages');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(messages);
    expect(messageService.getMessages).toHaveBeenCalledWith('u-1', 'c-1');
  });

  it('GET /:user_id/:conversation_id/messages/:message_id returns message', async () => {
    const message = { message_id: 'm-1', message_content: 'hi' };
    jest.mocked(messageService.getMessage).mockResolvedValue(message as any);
    const res = await request(app).get('/u-1/c-1/messages/m-1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(message);
    expect(messageService.getMessage).toHaveBeenCalledWith('u-1', 'c-1', 'm-1');
  });

  it('POST /:user_id/:conversation_id/messages creates message', async () => {
    jest.mocked(messageService.createMessage).mockResolvedValue('new-id' as any);
    const res = await request(app)
      .post('/u-1/c-1/messages')
      .send({
        user_id: 'u-1',
        conversation_id: 'c-1',
        message_content: 'Hello',
        role: 'user',
        therapist_id: 't-1',
      });
    expect(res.status).toBe(200);
    expect(messageService.createMessage).toHaveBeenCalled();
  });

  it('PUT /:user_id/:conversation_id/messages/:message_id updates message', async () => {
    jest.mocked(messageService.updateMessage).mockResolvedValue(1);
    const res = await request(app)
      .put('/u-1/c-1/messages/m-1')
      .send({ message_content: 'Updated' });
    expect(res.status).toBe(200);
    expect(messageService.updateMessage).toHaveBeenCalled();
  });

  it('DELETE /:user_id/:conversation_id/messages/:message_id deletes message', async () => {
    jest.mocked(messageService.deleteMessage).mockResolvedValue(1);
    const res = await request(app).delete('/u-1/c-1/messages/m-1');
    expect(res.status).toBe(200);
    expect(messageService.deleteMessage).toHaveBeenCalledWith('u-1', 'c-1', 'm-1');
  });
});
