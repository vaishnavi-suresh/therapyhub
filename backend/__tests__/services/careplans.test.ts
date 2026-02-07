jest.mock('../../api/config/mongo', () => {
  const m = {
    findOne: jest.fn(),
    insertOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };
  (global as any).__careplansServiceMocks = m;
  return {
    __esModule: true,
    default: { db: jest.fn(() => ({ collection: jest.fn(() => m) })) },
  };
});

import { getCarePlan, createCarePlan, updateCarePlan, deleteCarePlan } from '../../api/services/careplans';

const m = (global as any).__careplansServiceMocks as Record<string, jest.Mock>;

describe('careplans service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCarePlan', () => {
    it('returns care plan when found', async () => {
      const plan = { care_plan_id: 'cp-1', care_plan_name: 'Plan A' };
      m.findOne.mockResolvedValue(plan);
      const result = await getCarePlan('cp-1');
      expect(m.findOne).toHaveBeenCalledWith({ care_plan_id: 'cp-1' });
      expect(result).toEqual(plan);
    });
  });

  describe('createCarePlan', () => {
    it('inserts care plan and returns insertedId', async () => {
      m.insertOne.mockResolvedValue({ insertedId: 'new-id' });
      const plan = { care_plan_id: 'cp-1', care_plan_name: 'A' } as any;
      const result = await createCarePlan(plan);
      expect(m.insertOne).toHaveBeenCalledWith(plan);
      expect(result).toBe('new-id');
    });
  });

  describe('updateCarePlan', () => {
    it('updates care plan and returns modifiedCount', async () => {
      m.updateOne.mockResolvedValue({ modifiedCount: 1 });
      const plan = { care_plan_id: 'cp-1', care_plan_name: 'B' } as any;
      const result = await updateCarePlan('cp-1', plan);
      expect(m.updateOne).toHaveBeenCalledWith({ care_plan_id: 'cp-1' }, { $set: plan });
      expect(result).toBe(1);
    });
  });

  describe('deleteCarePlan', () => {
    it('deletes care plan and returns deletedCount', async () => {
      m.deleteOne.mockResolvedValue({ deletedCount: 1 });
      const result = await deleteCarePlan('cp-1');
      expect(m.deleteOne).toHaveBeenCalledWith({ care_plan_id: 'cp-1' });
      expect(result).toBe(1);
    });
  });
});
