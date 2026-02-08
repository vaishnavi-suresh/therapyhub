import { Request, Response } from 'express';
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../api/services/homeworks');

import {
  getHomeworkController,
  getAllHomeworksController,
  createHomeworkController,
  updateHomeworkController,
  deleteHomeworkController,
} from '../../api/controllers/homeworks';
import * as homeworksService from '../../api/services/homeworks';

function mockRequest(overrides: Partial<Request> = {}): Request {
  return { params: {}, body: {}, ...overrides } as Request;
}

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('homeworks controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHomeworkController', () => {
    it('returns homework by id', async () => {
      const homework = {
        homework_id: 'hw-1',
        user_id: 'u-1',
        therapist_id: 't-1',
        homework_title: 'Reflection',
      };
      const req = mockRequest({
        params: { user_id: 'u-1', therapist_id: 't-1', homework_id: 'hw-1' },
      });
      const res = mockResponse();
      jest.mocked(homeworksService.getHomework).mockResolvedValue(homework as any);
      await getHomeworkController(req, res);
      expect(homeworksService.getHomework).toHaveBeenCalledWith('u-1', 't-1', 'hw-1');
      expect(res.json).toHaveBeenCalledWith(homework);
    });

    it('returns null when homework not found', async () => {
      const req = mockRequest({
        params: { user_id: 'u-1', therapist_id: 't-1', homework_id: 'hw-1' },
      });
      const res = mockResponse();
      jest.mocked(homeworksService.getHomework).mockResolvedValue(null);
      await getHomeworkController(req, res);
      expect(res.json).toHaveBeenCalledWith(null);
    });
  });

  describe('getAllHomeworksController', () => {
    it('returns all homeworks for user and therapist', async () => {
      const homeworks = [
        { homework_id: 'hw-1', homework_title: 'Task 1' },
        { homework_id: 'hw-2', homework_title: 'Task 2' },
      ];
      const req = mockRequest({
        params: { user_id: 'u-1', therapist_id: 't-1' },
      });
      const res = mockResponse();
      jest.mocked(homeworksService.getAllHomeworks).mockResolvedValue(homeworks as any);
      await getAllHomeworksController(req, res);
      expect(homeworksService.getAllHomeworks).toHaveBeenCalledWith('u-1', 't-1');
      expect(res.json).toHaveBeenCalledWith(homeworks);
    });
  });

  describe('createHomeworkController', () => {
    it('creates homework and returns payload', async () => {
      const req = mockRequest({
        params: { user_id: 'u-1', therapist_id: 't-1' },
        body: {
          homework: {
            homework_title: 'Reflection',
            homework_prompt: 'Write your thoughts',
          },
        },
      });
      const res = mockResponse();
      jest.mocked(homeworksService.createHomework).mockResolvedValue('new-id' as any);
      await createHomeworkController(req, res);
      expect(homeworksService.createHomework).toHaveBeenCalledWith('u-1', 't-1', expect.objectContaining({
        homework_id: 'mock-uuid',
        user_id: 'u-1',
        therapist_id: 't-1',
        homework_title: 'Reflection',
        homework_prompt: 'Write your thoughts',
        homework_response: null,
        homework_status: 'pending',
      }));
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          homework_id: 'mock-uuid',
          user_id: 'u-1',
          therapist_id: 't-1',
          homework_title: 'Reflection',
          homework_prompt: 'Write your thoughts',
          homework_status: 'pending',
        })
      );
    });
  });

  describe('updateHomeworkController', () => {
    it('updates homework and returns updated document', async () => {
      const updated = {
        homework_id: 'hw-1',
        user_id: 'u-1',
        therapist_id: 't-1',
        homework_title: 'Updated',
        homework_prompt: 'Updated prompt',
        homework_response: 'Done',
        homework_status: 'completed',
      };
      const req = mockRequest({
        params: { user_id: 'u-1', therapist_id: 't-1', homework_id: 'hw-1' },
        body: {
          homework_title: 'Updated',
          homework_prompt: 'Updated prompt',
          homework_response: 'Done',
          homework_status: 'completed',
        },
      });
      const res = mockResponse();
      jest.mocked(homeworksService.updateHomework).mockResolvedValue(1);
      jest.mocked(homeworksService.getHomework).mockResolvedValue(updated as any);
      await updateHomeworkController(req, res);
      expect(homeworksService.updateHomework).toHaveBeenCalledWith('u-1', 't-1', 'hw-1', expect.any(Object));
      expect(homeworksService.getHomework).toHaveBeenCalledWith('u-1', 't-1', 'hw-1');
      expect(res.json).toHaveBeenCalledWith(updated);
    });
  });

  describe('deleteHomeworkController', () => {
    it('deletes homework and returns deletedCount', async () => {
      const req = mockRequest({
        params: { user_id: 'u-1', therapist_id: 't-1', homework_id: 'hw-1' },
      });
      const res = mockResponse();
      jest.mocked(homeworksService.deleteHomework).mockResolvedValue(1);
      await deleteHomeworkController(req, res);
      expect(homeworksService.deleteHomework).toHaveBeenCalledWith('u-1', 't-1', 'hw-1');
      expect(res.json).toHaveBeenCalledWith(1);
    });
  });
});
