jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../middleware/auth', () => ({
  checkJwt: (req: any, res: any, next: any) => next(),
  enrichUserFromDb: (req: any, res: any, next: any) => next(),
  requiredRoles: () => (req: any, res: any, next: any) => next(),
  requiredUserId: (req: any, res: any, next: any) => next(),
  requireUserOrTherapist: (req: any, res: any, next: any) => next(),
}));
jest.mock('../../api/services/therabot_conversations');

import request from 'supertest';
import express from 'express';
import therabotConversationsRouter from '../../api/routes/therabot_conversations';

const app = express();
app.use(express.json());
app.use('/therabot_conversations', therabotConversationsRouter);

import * as therabotConversationsService from '../../api/services/therabot_conversations';

describe('therabot_conversations routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /therabot_conversations/:conversation_id returns conversation', async () => {
    const conv = { conversation_id: 'c-1', user_id: 'u-1' };
    jest.mocked(therabotConversationsService.getTherabotConversation).mockResolvedValue(conv as any);
    const res = await request(app).get('/therabot_conversations/c-1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(conv);
  });

  it('POST /therabot_conversations creates conversation', async () => {
    jest.mocked(therabotConversationsService.createTherabotConversation).mockResolvedValue('new-id' as any);
    const res = await request(app)
      .post('/therabot_conversations')
      .send({ user_id: 'u-1', therapist_id: 't-1' });
    expect(res.status).toBe(200);
    expect(therabotConversationsService.createTherabotConversation).toHaveBeenCalled();
  });

  it('PUT /therabot_conversations/:conversation_id updates conversation', async () => {
    jest.mocked(therabotConversationsService.getTherabotConversation).mockResolvedValue({ conversation_id: 'c-1' } as any);
    const res = await request(app)
      .put('/therabot_conversations/c-1')
      .send({ user_id: 'u-1', therapist_id: 't-1' });
    expect(res.status).toBe(200);
    expect(therabotConversationsService.updateTherabotConversation).toHaveBeenCalledWith('c-1', expect.any(Object));
  });

  it('DELETE /therabot_conversations/:conversation_id deletes conversation', async () => {
    jest.mocked(therabotConversationsService.deleteTherabotConversation).mockResolvedValue(1);
    const res = await request(app).delete('/therabot_conversations/c-1');
    expect(res.status).toBe(200);
    expect(therabotConversationsService.deleteTherabotConversation).toHaveBeenCalledWith('c-1');
  });
});
