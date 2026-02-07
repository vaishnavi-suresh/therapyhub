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
  (global as any).__messageServiceMocks = m;
  return {
    __esModule: true,
    default: { db: jest.fn(() => ({ collection: jest.fn(() => m) })) },
  };
});

import {
  getMessages,
  getMessage,
  createMessage,
  updateMessage,
  deleteMessage,
} from '../../api/services/message';

const m = (global as any).__messageServiceMocks as Record<string, jest.Mock>;

describe('message service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    m.find.mockReturnValue({ toArray: m.toArray });
  });

  describe('getMessages', () => {
    it('returns array of messages', async () => {
      const messages = [{ message_id: 'm-1' }];
      m.toArray.mockResolvedValue(messages);
      const result = await getMessages('u-1', 'c-1');
      expect(m.find).toHaveBeenCalledWith({ user_id: 'u-1', conversation_id: 'c-1' });
      expect(result).toEqual(messages);
    });
  });

  describe('getMessage', () => {
    it('returns message when found', async () => {
      const message = { message_id: 'm-1', message_content: 'hi' };
      m.findOne.mockResolvedValue(message);
      const result = await getMessage('u-1', 'c-1', 'm-1');
      expect(m.findOne).toHaveBeenCalledWith({
        user_id: 'u-1',
        conversation_id: 'c-1',
        message_id: 'm-1',
      });
      expect(result).toEqual(message);
    });
  });

  describe('createMessage', () => {
    it('inserts message and returns insertedId', async () => {
      m.insertOne.mockResolvedValue({ insertedId: 'new-id' });
      const message = { message_id: 'm-1', message_content: 'hi' } as any;
      const result = await createMessage(message);
      expect(m.insertOne).toHaveBeenCalledWith(message);
      expect(result).toBe('new-id');
    });
  });

  describe('updateMessage', () => {
    it('updates message and returns modifiedCount', async () => {
      m.updateOne.mockResolvedValue({ modifiedCount: 1 });
      const message = { message_content: 'updated' } as any;
      const result = await updateMessage('u-1', 'c-1', 'm-1', message);
      expect(m.updateOne).toHaveBeenCalledWith(
        { user_id: 'u-1', conversation_id: 'c-1', message_id: 'm-1' },
        { $set: message }
      );
      expect(result).toBe(1);
    });
  });

  describe('deleteMessage', () => {
    it('deletes message and returns deletedCount', async () => {
      m.deleteOne.mockResolvedValue({ deletedCount: 1 });
      const result = await deleteMessage('u-1', 'c-1', 'm-1');
      expect(m.deleteOne).toHaveBeenCalledWith({
        user_id: 'u-1',
        conversation_id: 'c-1',
        message_id: 'm-1',
      });
      expect(result).toBe(1);
    });
  });
});
