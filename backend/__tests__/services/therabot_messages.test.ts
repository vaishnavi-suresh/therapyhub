jest.mock('../../api/config/mongo', () => {
  const mockToArray = jest.fn();
  const m = {
    find: jest.fn(() => ({ toArray: mockToArray })),
    findOne: jest.fn(),
    insertOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    toArray: mockToArray,
  };
  (global as any).__therabotMessagesServiceMocks = m;
  return {
    __esModule: true,
    default: { db: jest.fn(() => ({ collection: jest.fn(() => m) })) },
  };
});

import {
  getTherabotMessages,
  getTherabotMessage,
  createTherabotMessage,
  updateTherabotMessage,
  deleteTherabotMessage,
} from '../../api/services/therabot_messages';

const m = (global as any).__therabotMessagesServiceMocks as Record<string, jest.Mock>;

describe('therabot_messages service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    m.find.mockReturnValue({ toArray: m.toArray });
  });

  describe('getTherabotMessages', () => {
    it('returns array of messages', async () => {
      const messages = [{ message_id: 'm-1' }];
      m.toArray.mockResolvedValue(messages);
      const result = await getTherabotMessages('u-1', 'c-1');
      expect(m.find).toHaveBeenCalledWith({ user_id: 'u-1', conversation_id: 'c-1' });
      expect(result).toEqual(messages);
    });

    it('returns legacy messages when therabot empty', async () => {
      const legacyMessages = [{ message_id: 'm-legacy' }];
      m.toArray.mockResolvedValueOnce([]).mockResolvedValueOnce(legacyMessages);
      const result = await getTherabotMessages('u-1', 'c-1');
      expect(result).toEqual(legacyMessages);
    });
  });

  describe('getTherabotMessage', () => {
    it('returns message when found', async () => {
      const message = { message_id: 'm-1', message_content: 'hi' };
      m.findOne.mockResolvedValue(message);
      const result = await getTherabotMessage('u-1', 'c-1', 'm-1');
      expect(m.findOne).toHaveBeenCalledWith({
        user_id: 'u-1',
        conversation_id: 'c-1',
        message_id: 'm-1',
      });
      expect(result).toEqual(message);
    });

    it('returns legacy message when therabot not found', async () => {
      const legacyMsg = { message_id: 'm-legacy', message_content: 'hi' };
      m.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(legacyMsg);
      const result = await getTherabotMessage('u-1', 'c-1', 'm-legacy');
      expect(result).toEqual(legacyMsg);
    });
  });

  describe('createTherabotMessage', () => {
    it('inserts message and returns insertedId', async () => {
      m.insertOne.mockResolvedValue({ insertedId: 'new-id' });
      const message = { message_id: 'm-1', message_content: 'hi' } as any;
      const result = await createTherabotMessage(message);
      expect(m.insertOne).toHaveBeenCalledWith(message);
      expect(result).toBe('new-id');
    });
  });

  describe('updateTherabotMessage', () => {
    it('updates message and returns modifiedCount', async () => {
      m.updateOne.mockResolvedValue({ modifiedCount: 1 });
      const update = { message_content: 'updated' };
      const result = await updateTherabotMessage('u-1', 'c-1', 'm-1', update);
      expect(m.updateOne).toHaveBeenCalledWith(
        { user_id: 'u-1', conversation_id: 'c-1', message_id: 'm-1' },
        { $set: update }
      );
      expect(result).toBe(1);
    });
  });

  describe('deleteTherabotMessage', () => {
    it('deletes message and returns deletedCount', async () => {
      m.deleteOne.mockResolvedValue({ deletedCount: 1 });
      const result = await deleteTherabotMessage('u-1', 'c-1', 'm-1');
      expect(m.deleteOne).toHaveBeenCalledWith({
        user_id: 'u-1',
        conversation_id: 'c-1',
        message_id: 'm-1',
      });
      expect(result).toBe(1);
    });
  });
});
