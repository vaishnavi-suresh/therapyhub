jest.mock('../../api/config/mongo', () => {
  const m = {
    findOne: jest.fn(),
    insertOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };
  (global as any).__conversationsServiceMocks = m;
  return {
    __esModule: true,
    default: { db: jest.fn(() => ({ collection: jest.fn(() => m) })) },
  };
});

import {
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
} from '../../api/services/conversations';

const m = (global as any).__conversationsServiceMocks as Record<string, jest.Mock>;

describe('conversations service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConversation', () => {
    it('returns conversation when found', async () => {
      const conv = { conversation_id: 'c-1', user_id: 'u-1' };
      m.findOne.mockResolvedValue(conv);
      const result = await getConversation('c-1');
      expect(m.findOne).toHaveBeenCalledWith({ conversation_id: 'c-1' });
      expect(result).toEqual(conv);
    });
  });

  describe('createConversation', () => {
    it('inserts conversation and returns insertedId', async () => {
      m.insertOne.mockResolvedValue({ insertedId: 'new-id' });
      const conv = { conversation_id: 'c-1', user_id: 'u-1' } as any;
      const result = await createConversation(conv);
      expect(m.insertOne).toHaveBeenCalledWith(conv);
      expect(result).toBe('new-id');
    });
  });

  describe('updateConversation', () => {
    it('updates conversation and returns modifiedCount', async () => {
      m.updateOne.mockResolvedValue({ modifiedCount: 1 });
      const conv = { conversation_id: 'c-1', user_id: 'u-1' } as any;
      const result = await updateConversation('c-1', conv);
      expect(m.updateOne).toHaveBeenCalledWith({ conversation_id: 'c-1' }, { $set: conv });
      expect(result).toBe(1);
    });
  });

  describe('deleteConversation', () => {
    it('deletes conversation and returns deletedCount', async () => {
      m.deleteOne.mockResolvedValue({ deletedCount: 1 });
      const result = await deleteConversation('c-1');
      expect(m.deleteOne).toHaveBeenCalledWith({ conversation_id: 'c-1' });
      expect(result).toBe(1);
    });
  });
});
