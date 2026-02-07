import { Request, Response } from 'express';
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
jest.mock('../../api/services/careplans');

import {
  getCarePlanController,
  createCarePlanController,
  updateCarePlanController,
  deleteCarePlanController,
} from '../../api/controllers/carePlanController';
import * as careplansService from '../../api/services/careplans';

function mockRequest(overrides: Partial<Request> = {}): Request {
  return { params: {}, body: {}, ...overrides } as Request;
}

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('carePlanController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCarePlanController', () => {
    it('returns care plan by id', async () => {
      const plan = { care_plan_id: 'cp-1', care_plan_name: 'Plan A' };
      const req = mockRequest({ params: { care_plan_id: 'cp-1' } });
      const res = mockResponse();
      jest.mocked(careplansService.getCarePlan).mockResolvedValue(plan as any);
      await getCarePlanController(req, res);
      expect(careplansService.getCarePlan).toHaveBeenCalledWith('cp-1');
      expect(res.json).toHaveBeenCalledWith(plan);
    });
  });

  describe('createCarePlanController', () => {
    it('creates care plan and returns result', async () => {
      const req = mockRequest({
        body: {
          user_id: 'u-1',
          therapist_id: 't-1',
          care_plan_name: 'Plan A',
          care_plan_description: 'Desc',
        },
      });
      const res = mockResponse();
      jest.mocked(careplansService.createCarePlan).mockResolvedValue('new-id' as any);
      await createCarePlanController(req, res);
      expect(careplansService.createCarePlan).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith('new-id');
    });
  });

  describe('updateCarePlanController', () => {
    it('updates care plan and returns result', async () => {
      const req = mockRequest({
        params: { care_plan_id: 'cp-1' },
        body: {
          user_id: 'u-1',
          therapist_id: 't-1',
          care_plan_name: 'Plan B',
          care_plan_description: 'Desc2',
        },
      });
      const res = mockResponse();
      jest.mocked(careplansService.updateCarePlan).mockResolvedValue(1);
      await updateCarePlanController(req, res);
      expect(careplansService.updateCarePlan).toHaveBeenCalledWith('cp-1', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteCarePlanController', () => {
    it('deletes care plan and returns result', async () => {
      const req = mockRequest({ params: { care_plan_id: 'cp-1' } });
      const res = mockResponse();
      jest.mocked(careplansService.deleteCarePlan).mockResolvedValue(1);
      await deleteCarePlanController(req, res);
      expect(careplansService.deleteCarePlan).toHaveBeenCalledWith('cp-1');
      expect(res.json).toHaveBeenCalledWith(1);
    });
  });
});
