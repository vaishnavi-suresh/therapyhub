jest.mock('../../api/config/mongo', () => {
  const toArray = jest.fn();
  return {
    __esModule: true,
    default: {
      db: jest.fn(() => ({
        collection: jest.fn(() => ({
          find: jest.fn(() => ({ toArray })),
        })),
      })),
    },
  };
});

import { getMessagesFromLastWeek, getHomeworksFromLastWeek } from '../../utils/recentData';
import mongoClient from '../../api/config/mongo';

describe('Recent Data Utils', () => {
  let mockCollection: any;
  let mockDb: any;
  let mockMongoClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockMongoClient = mongoClient as any;
    mockDb = { collection: jest.fn() };
    mockCollection = {
      find: jest.fn(() => ({ toArray: jest.fn() })),
    };
    mockMongoClient.db = jest.fn(() => mockDb);
    mockDb.collection = jest.fn(() => mockCollection);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getMessagesFromLastWeek', () => {
    it('should get messages from last week with user_id and therapist_id', async () => {
      const mockMessages = [{ message_id: '1' }, { message_id: '2' }];
      const mockToArray = jest.fn().mockResolvedValue(mockMessages);
      mockCollection.find.mockReturnValue({ toArray: mockToArray });

      const result = await getMessagesFromLastWeek('user1', 'therapist1');

      expect(mockCollection.find).toHaveBeenCalledWith({
        message_created_at: { $gte: expect.any(Date) },
        user_id: 'user1',
        therapist_id: 'therapist1',
      });
      expect(result).toEqual(mockMessages);
    });

    it('should get messages from last week without filters', async () => {
      const mockMessages = [{ message_id: '1' }];
      const mockToArray = jest.fn().mockResolvedValue(mockMessages);
      mockCollection.find.mockReturnValue({ toArray: mockToArray });

      const result = await getMessagesFromLastWeek();

      expect(mockCollection.find).toHaveBeenCalledWith({
        message_created_at: { $gte: expect.any(Date) },
      });
      expect(result).toEqual(mockMessages);
    });
  });

  describe('getHomeworksFromLastWeek', () => {
    it('should get homeworks from last week with user_id and therapist_id', async () => {
      const mockHomeworks = [{ homework_id: '1' }];
      const mockToArray = jest.fn().mockResolvedValue(mockHomeworks);
      mockCollection.find.mockReturnValue({ toArray: mockToArray });

      const result = await getHomeworksFromLastWeek('user1', 'therapist1');

      expect(mockCollection.find).toHaveBeenCalledWith({
        homework_created_at: { $gte: expect.any(Date) },
        user_id: 'user1',
        therapist_id: 'therapist1',
      });
      expect(result).toEqual(mockHomeworks);
    });

    it('should get homeworks from last week without filters', async () => {
      const mockHomeworks = [{ homework_id: '1' }];
      const mockToArray = jest.fn().mockResolvedValue(mockHomeworks);
      mockCollection.find.mockReturnValue({ toArray: mockToArray });

      const result = await getHomeworksFromLastWeek();

      expect(mockCollection.find).toHaveBeenCalledWith({
        homework_created_at: { $gte: expect.any(Date) },
      });
      expect(result).toEqual(mockHomeworks);
    });
  });
});
