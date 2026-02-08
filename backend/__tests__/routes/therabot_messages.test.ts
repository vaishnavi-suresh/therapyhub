jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../middleware/auth', () => ({
  checkJwt: (req: any, res: any, next: any) => next(),
  enrichUserFromDb: (req: any, res: any, next: any) => next(),
  requiredRoleIn: () => (req: any, res: any, next: any) => next(),
  requiredRoles: () => (req: any, res: any, next: any) => next(),
  requiredUserId: (req: any, res: any, next: any) => next(),
  requireUserOrTherapist: (req: any, res: any, next: any) => next(),
}));
jest.mock('../../api/services/therabot_messages');
jest.mock('../../api/services/therabot_conversations');
jest.mock('../../utils/genAI', () => ({ createTherapistBotResponse: jest.fn().mockResolvedValue('Bot reply') }));

import request from 'supertest';
import express from 'express';
import therabotMessagesRouter from '../../api/routes/therabot_messages';

const app = express();
app.use(express.json());
app.use(therabotMessagesRouter);

import * as therabotMessagesService from '../../api/services/therabot_messages';
import * as therabotConversationsService from '../../api/services/therabot_conversations';

describe('therabot_messages routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const basePath = '/u-1/c-1/therabot_messages';

  it('GET /:user_id/:conversation_id/therabot_messages returns messages', async () => {
    const messages = [{ message_id: 'm-1' }];
    jest.mocked(therabotMessagesService.getTherabotMessages).mockResolvedValue(messages as any);
    const res = await request(app).get(basePath);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(messages);
    expect(therabotMessagesService.getTherabotMessages).toHaveBeenCalledWith('u-1', 'c-1');
  });

  it('GET /:user_id/:conversation_id/therabot_messages/:message_id returns message', async () => {
    const message = { message_id: 'm-1', message_content: 'hi' };
    jest.mocked(therabotMessagesService.getTherabotMessage).mockResolvedValue(message as any);
    const res = await request(app).get(`${basePath}/m-1`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(message);
    expect(therabotMessagesService.getTherabotMessage).toHaveBeenCalledWith('u-1', 'c-1', 'm-1');
  });

  it('POST /:user_id/:conversation_id/therabot_messages creates message', async () => {
    jest.mocked(therabotConversationsService.getTherabotConversation).mockResolvedValue({ care_plan_id: null } as any);
    jest.mocked(therabotMessagesService.createTherabotMessage).mockResolvedValue('new-id' as any);
    jest.mocked(therabotMessagesService.getTherabotMessages).mockResolvedValue([]);
    const res = await request(app)
      .post(basePath)
      .send({
        user_id: 'u-1',
        conversation_id: 'c-1',
        message_content: 'Hello',
        role: 'user',
        therapist_id: 't-1',
      });
    expect(res.status).toBe(200);
    expect(therabotMessagesService.createTherabotMessage).toHaveBeenCalled();
  });

  it('PUT /:user_id/:conversation_id/therabot_messages/:message_id updates message', async () => {
    jest.mocked(therabotMessagesService.getTherabotMessage).mockResolvedValue({ message_id: 'm-1' } as any);
    const res = await request(app)
      .put(`${basePath}/m-1`)
      .send({ message_content: 'Updated' });
    expect(res.status).toBe(200);
    expect(therabotMessagesService.updateTherabotMessage).toHaveBeenCalled();
  });

  it('DELETE /:user_id/:conversation_id/therabot_messages/:message_id deletes message', async () => {
    jest.mocked(therabotMessagesService.deleteTherabotMessage).mockResolvedValue(1);
    const res = await request(app).delete(`${basePath}/m-1`);
    expect(res.status).toBe(200);
    expect(therabotMessagesService.deleteTherabotMessage).toHaveBeenCalledWith('u-1', 'c-1', 'm-1');
  });
});
