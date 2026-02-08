jest.mock('../../api/config/mongo', () => {
  const mockToArray = jest.fn();
  const m = {
    findOne: jest.fn(),
    insertOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    find: jest.fn(() => ({ sort: jest.fn(() => ({ toArray: mockToArray })) })),
    mockToArray,
  };
  (global as any).__therabotConversationsServiceMocks = m;
  return {
    __esModule: true,
    default: { db: jest.fn(() => ({ collection: jest.fn(() => m) })) },
  };
});

import {
  getTherabotConversation,
  getTherabotConversationsByUserId,
  createTherabotConversation,
  updateTherabotConversation,
  deleteTherabotConversation,
} from '../../api/services/therabot_conversations';

const m = (global as any).__therabotConversationsServiceMocks as Record<string, jest.Mock>;

describe('therabot_conversations service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTherabotConversation', () => {
    it('returns conversation when found', async () => {
      const conv = { conversation_id: 'c-1', user_id: 'u-1' };
      m.findOne.mockResolvedValue(conv);
      const result = await getTherabotConversation('c-1');
      expect(m.findOne).toHaveBeenCalledWith({ conversation_id: 'c-1' });
      expect(result).toEqual(conv);
    });

    it('returns legacy conversation when therabot not found', async () => {
      const legacyConv = { conversation_id: 'c-1', user_id: 'u-1' };
      m.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(legacyConv);
      const result = await getTherabotConversation('c-1');
      expect(result).toEqual(legacyConv);
    });
  });

  describe('getTherabotConversationsByUserId', () => {
    it('returns merged conversations from both collections', async () => {
      const therabotConvs = [{ conversation_id: 'c-1', conversation_created_at: new Date('2024-01-15') }];
      const legacyConvs = [{ conversation_id: 'c-2', conversation_created_at: new Date('2024-01-10') }];
      (m as any).mockToArray.mockResolvedValueOnce(therabotConvs).mockResolvedValueOnce(legacyConvs);
      const result = await getTherabotConversationsByUserId('u-1');
      expect(result).toHaveLength(2);
      expect(result[0].conversation_id).toBe('c-1');
      expect(result[1].conversation_id).toBe('c-2');
    });
  });

  describe('createTherabotConversation', () => {
    it('inserts conversation and returns insertedId', async () => {
      m.insertOne.mockResolvedValue({ insertedId: 'new-id' });
      const conv = { conversation_id: 'c-1', user_id: 'u-1' } as any;
      const result = await createTherabotConversation(conv);
      expect(m.insertOne).toHaveBeenCalledWith(conv);
      expect(result).toBe('new-id');
    });
  });

  describe('updateTherabotConversation', () => {
    it('updates conversation and returns modifiedCount', async () => {
      m.updateOne.mockResolvedValue({ modifiedCount: 1 });
      const conv = { conversation_id: 'c-1', user_id: 'u-1' } as any;
      const result = await updateTherabotConversation('c-1', conv);
      expect(m.updateOne).toHaveBeenCalledWith({ conversation_id: 'c-1' }, { $set: conv });
      expect(result).toBe(1);
    });
  });

  describe('deleteTherabotConversation', () => {
    it('deletes conversation and returns deletedCount', async () => {
      m.deleteOne.mockResolvedValue({ deletedCount: 1 });
      const result = await deleteTherabotConversation('c-1');
      expect(m.deleteOne).toHaveBeenCalledWith({ conversation_id: 'c-1' });
      expect(result).toBe(1);
    });
  });
});
