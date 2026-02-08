jest.mock('../../api/config/mongo', () => {
  const mockToArray = jest.fn();
  const m = {
    findOne: jest.fn(),
    find: jest.fn(() => ({ toArray: mockToArray })),
    insertOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    toArray: mockToArray,
  };
  (global as any).__homeworksServiceMocks = m;
  return {
    __esModule: true,
    default: { db: jest.fn(() => ({ collection: jest.fn(() => m) })) },
  };
});

import {
  getHomework,
  getAllHomeworks,
  createHomework,
  updateHomework,
  deleteHomework,
} from '../../api/services/homeworks';

const m = (global as any).__homeworksServiceMocks as Record<string, jest.Mock>;

describe('homeworks service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    m.find.mockReturnValue({ toArray: m.toArray });
  });

  describe('getHomework', () => {
    it('returns homework when found', async () => {
      const homework = {
        homework_id: 'hw-1',
        user_id: 'u-1',
        therapist_id: 't-1',
        homework_title: 'Reflection',
        homework_prompt: 'Write your thoughts',
      };
      m.findOne.mockResolvedValue(homework);
      const result = await getHomework('u-1', 't-1', 'hw-1');
      expect(m.findOne).toHaveBeenCalledWith({ user_id: 'u-1', therapist_id: 't-1', homework_id: 'hw-1' });
      expect(result).toEqual(homework);
    });

    it('returns null when not found', async () => {
      m.findOne.mockResolvedValue(null);
      const result = await getHomework('u-1', 't-1', 'hw-1');
      expect(result).toBeNull();
    });
  });

  describe('getAllHomeworks', () => {
    it('returns array of homeworks for user and therapist', async () => {
      const homeworks = [
        { homework_id: 'hw-1', user_id: 'u-1', therapist_id: 't-1', homework_title: 'Task 1' },
        { homework_id: 'hw-2', user_id: 'u-1', therapist_id: 't-1', homework_title: 'Task 2' },
      ];
      m.toArray.mockResolvedValue(homeworks);
      const result = await getAllHomeworks('u-1', 't-1');
      expect(m.find).toHaveBeenCalledWith({ user_id: 'u-1', therapist_id: 't-1' });
      expect(result).toEqual(homeworks);
    });

    it('returns empty array when no homeworks', async () => {
      m.toArray.mockResolvedValue([]);
      const result = await getAllHomeworks('u-1', 't-1');
      expect(result).toEqual([]);
    });
  });

  describe('createHomework', () => {
    it('inserts homework and returns insertedId', async () => {
      m.insertOne.mockResolvedValue({ insertedId: 'new-id' });
      const homework = {
        homework_id: 'hw-1',
        user_id: 'u-1',
        therapist_id: 't-1',
        homework_title: 'Reflection',
        homework_prompt: 'Write your thoughts',
        homework_response: null,
        homework_status: 'pending',
        homework_created_at: new Date(),
        homework_updated_at: new Date(),
      } as any;
      const result = await createHomework('u-1', 't-1', homework);
      expect(m.insertOne).toHaveBeenCalledWith(homework);
      expect(result).toBe('new-id');
    });
  });

  describe('updateHomework', () => {
    it('updates homework and returns modifiedCount', async () => {
      m.updateOne.mockResolvedValue({ modifiedCount: 1 });
      const homework = {
        homework_id: 'hw-1',
        user_id: 'u-1',
        therapist_id: 't-1',
        homework_title: 'Updated',
        homework_prompt: 'Updated prompt',
        homework_response: 'Done',
        homework_status: 'completed',
      } as any;
      const result = await updateHomework('u-1', 't-1', 'hw-1', homework);
      expect(m.updateOne).toHaveBeenCalledWith(
        { user_id: 'u-1', therapist_id: 't-1', homework_id: 'hw-1' },
        { $set: homework }
      );
      expect(result).toBe(1);
    });

    it('returns 0 when no document matched', async () => {
      m.updateOne.mockResolvedValue({ modifiedCount: 0 });
      const homework = { homework_id: 'hw-1' } as any;
      const result = await updateHomework('u-1', 't-1', 'hw-1', homework);
      expect(result).toBe(0);
    });
  });

  describe('deleteHomework', () => {
    it('deletes homework and returns deletedCount', async () => {
      m.deleteOne.mockResolvedValue({ deletedCount: 1 });
      const result = await deleteHomework('u-1', 't-1', 'hw-1');
      expect(m.deleteOne).toHaveBeenCalledWith({
        user_id: 'u-1',
        therapist_id: 't-1',
        homework_id: 'hw-1',
      });
      expect(result).toBe(1);
    });

    it('returns 0 when no document matched', async () => {
      m.deleteOne.mockResolvedValue({ deletedCount: 0 });
      const result = await deleteHomework('u-1', 't-1', 'hw-1');
      expect(result).toBe(0);
    });
  });
});
