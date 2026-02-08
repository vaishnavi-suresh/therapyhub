jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../api/services/homeworks');

import request from 'supertest';
import express from 'express';
import { homeworksRouter } from '../../api/routes/homeworks';

const app = express();
app.use(express.json());
app.use('/homeworks', homeworksRouter);

import * as homeworksService from '../../api/services/homeworks';

describe('homeworks routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /homeworks/:user_id/:therapist_id/:homework_id', () => {
    it('returns homework when found', async () => {
      const homework = {
        homework_id: 'hw-1',
        user_id: 'u-1',
        therapist_id: 't-1',
        homework_title: 'Reflection',
        homework_prompt: 'Write your thoughts',
      };
      jest.mocked(homeworksService.getHomework).mockResolvedValue(homework as any);
      const res = await request(app).get('/homeworks/u-1/t-1/hw-1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(homework);
      expect(homeworksService.getHomework).toHaveBeenCalledWith('u-1', 't-1', 'hw-1');
    });
  });

  describe('GET /homeworks/:user_id/:therapist_id', () => {
    it('returns all homeworks for user and therapist', async () => {
      const homeworks = [
        { homework_id: 'hw-1', homework_title: 'Task 1' },
        { homework_id: 'hw-2', homework_title: 'Task 2' },
      ];
      jest.mocked(homeworksService.getAllHomeworks).mockResolvedValue(homeworks as any);
      const res = await request(app).get('/homeworks/u-1/t-1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(homeworks);
      expect(homeworksService.getAllHomeworks).toHaveBeenCalledWith('u-1', 't-1');
    });
  });

  describe('POST /homeworks/:user_id/:therapist_id', () => {
    it('creates homework', async () => {
      jest.mocked(homeworksService.createHomework).mockResolvedValue('new-id' as any);
      const res = await request(app)
        .post('/homeworks/u-1/t-1')
        .send({
          homework: {
            homework_title: 'Reflection',
            homework_prompt: 'Write your thoughts',
          },
        });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        homework_id: 'mock-uuid',
        user_id: 'u-1',
        therapist_id: 't-1',
        homework_title: 'Reflection',
        homework_prompt: 'Write your thoughts',
        homework_status: 'pending',
      });
      expect(homeworksService.createHomework).toHaveBeenCalled();
    });
  });

  describe('PUT /homeworks/:user_id/:therapist_id/:homework_id', () => {
    it('updates homework', async () => {
      const updated = {
        homework_id: 'hw-1',
        user_id: 'u-1',
        therapist_id: 't-1',
        homework_title: 'Updated',
        homework_prompt: 'Updated prompt',
        homework_response: 'Done',
        homework_status: 'completed',
      };
      jest.mocked(homeworksService.updateHomework).mockResolvedValue(1);
      jest.mocked(homeworksService.getHomework).mockResolvedValue(updated as any);
      const res = await request(app)
        .put('/homeworks/u-1/t-1/hw-1')
        .send({
          homework_title: 'Updated',
          homework_prompt: 'Updated prompt',
          homework_response: 'Done',
          homework_status: 'completed',
        });
      expect(res.status).toBe(200);
      expect(res.body).toEqual(updated);
      expect(homeworksService.updateHomework).toHaveBeenCalled();
      expect(homeworksService.getHomework).toHaveBeenCalledWith('u-1', 't-1', 'hw-1');
    });
  });

  describe('DELETE /homeworks/:user_id/:therapist_id/:homework_id', () => {
    it('deletes homework', async () => {
      jest.mocked(homeworksService.deleteHomework).mockResolvedValue(1);
      const res = await request(app).delete('/homeworks/u-1/t-1/hw-1');
      expect(res.status).toBe(200);
      expect(res.body).toBe(1);
      expect(homeworksService.deleteHomework).toHaveBeenCalledWith('u-1', 't-1', 'hw-1');
    });
  });
});
