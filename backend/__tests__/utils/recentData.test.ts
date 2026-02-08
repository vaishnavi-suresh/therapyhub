const mockToArray = jest.fn();
const mockFind = jest.fn(() => ({ toArray: mockToArray }));
const mockCollection = jest.fn(() => ({ find: mockFind }));
const mockDb = jest.fn(() => ({ collection: mockCollection }));

jest.mock('../../api/config/mongo', () => ({
  __esModule: true,
  default: {
    db: mockDb,
  },
}));

import { getMessagesFromLastWeek, getHomeworksFromLastWeek } from '../../utils/recentData';

describe('Recent Data Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getMessagesFromLastWeek', () => {
    it('should get messages from last week with user_id and therapist_id', async () => {
      const mockMessages = [{ message_id: '1' }, { message_id: '2' }];
      mockToArray.mockResolvedValue(mockMessages);

      const result = await getMessagesFromLastWeek('user1', 'therapist1');

      expect(mockCollection).toHaveBeenCalledWith('therabot_messages');
      expect(mockFind).toHaveBeenCalledWith({
        message_created_at: { $gte: expect.any(Date) },
        user_id: 'user1',
        therapist_id: 'therapist1',
      });
      expect(result).toEqual(mockMessages);
    });

    it('should get messages from last week without filters', async () => {
      const mockMessages = [{ message_id: '1' }];
      mockToArray.mockResolvedValue(mockMessages);

      const result = await getMessagesFromLastWeek();

      expect(mockCollection).toHaveBeenCalledWith('therabot_messages');
      expect(mockFind).toHaveBeenCalledWith({
        message_created_at: { $gte: expect.any(Date) },
      });
      expect(result).toEqual(mockMessages);
    });
  });

  describe('getHomeworksFromLastWeek', () => {
    it('should get homeworks from last week with user_id and therapist_id', async () => {
      const mockHomeworks = [{ homework_id: '1' }];
      mockToArray.mockResolvedValue(mockHomeworks);

      const result = await getHomeworksFromLastWeek('user1', 'therapist1');

      expect(mockCollection).toHaveBeenCalledWith('homeworks');
      expect(mockFind).toHaveBeenCalledWith({
        homework_created_at: { $gte: expect.any(Date) },
        user_id: 'user1',
        therapist_id: 'therapist1',
      });
      expect(result).toEqual(mockHomeworks);
    });

    it('should get homeworks from last week without filters', async () => {
      const mockHomeworks = [{ homework_id: '1' }];
      mockToArray.mockResolvedValue(mockHomeworks);

      const result = await getHomeworksFromLastWeek();

      expect(mockCollection).toHaveBeenCalledWith('homeworks');
      expect(mockFind).toHaveBeenCalledWith({
        homework_created_at: { $gte: expect.any(Date) },
      });
      expect(result).toEqual(mockHomeworks);
    });
  });
});
