const mockToArray = jest.fn();
const mockFindOne = jest.fn();
const mockFind = jest.fn(() => ({ toArray: mockToArray }));
const mockInsertOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockDeleteOne = jest.fn();
const mockCollection = jest.fn(() => ({
  findOne: mockFindOne,
  find: mockFind,
  insertOne: mockInsertOne,
  updateOne: mockUpdateOne,
  deleteOne: mockDeleteOne,
}));
const mockDb = jest.fn(() => ({ collection: mockCollection }));

jest.mock('../../api/config/mongo', () => ({
  __esModule: true,
  default: {
    db: mockDb,
  },
}));

import {
  createMeetingRecording,
  getMeetingRecordings,
  getMeetingRecording,
  updateMeetingRecording,
  deleteMeetingRecording,
} from '../../api/services/meeting_recordings';

describe('Meeting Recordings Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMeetingRecording', () => {
    it('should create a meeting recording', async () => {
      const mockRecording = {
        meeting_id: 'test-meeting-id',
        user_id: 'user1',
        therapist_id: 'therapist1',
        recording_url: 'https://example.com/recording.mp4',
        recording_created_at: new Date(),
        transcript: null,
        analysis: '',
      };

      const mockInsertedId = { insertedId: 'test-id' };
      mockInsertOne.mockResolvedValue(mockInsertedId);
      mockFindOne.mockResolvedValue(mockRecording);

      const result = await createMeetingRecording(mockRecording as any);

      expect(mockCollection).toHaveBeenCalledWith('meeting_recordings');
      expect(mockInsertOne).toHaveBeenCalledWith(mockRecording);
      expect(mockFindOne).toHaveBeenCalledWith({ _id: mockInsertedId.insertedId });
      expect(result).toEqual(mockRecording);
    });
  });

  describe('getMeetingRecordings', () => {
    it('should get all meeting recordings for user and therapist', async () => {
      const mockRecordings = [
        { meeting_id: 'meeting1', user_id: 'user1', therapist_id: 'therapist1' },
        { meeting_id: 'meeting2', user_id: 'user1', therapist_id: 'therapist1' },
      ];

      mockToArray.mockResolvedValue(mockRecordings);

      const result = await getMeetingRecordings('user1', 'therapist1');

      expect(mockCollection).toHaveBeenCalledWith('meeting_recordings');
      expect(mockFind).toHaveBeenCalledWith({ user_id: 'user1', therapist_id: 'therapist1' });
      expect(mockToArray).toHaveBeenCalled();
      expect(result).toEqual(mockRecordings);
    });
  });

  describe('getMeetingRecording', () => {
    it('should get a single meeting recording by ID', async () => {
      const mockRecording = {
        meeting_id: 'test-meeting-id',
        user_id: 'user1',
        therapist_id: 'therapist1',
      };

      mockFindOne.mockResolvedValue(mockRecording);

      const result = await getMeetingRecording('test-meeting-id');

      expect(mockCollection).toHaveBeenCalledWith('meeting_recordings');
      expect(mockFindOne).toHaveBeenCalledWith({ meeting_id: 'test-meeting-id' });
      expect(result).toEqual(mockRecording);
    });

    it('should return null if recording not found', async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await getMeetingRecording('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('updateMeetingRecording', () => {
    it('should update a meeting recording', async () => {
      const updateData = {
        transcript: 'Test transcript',
        analysis: 'Test analysis',
      };

      const mockUpdateResult = { modifiedCount: 1 };
      mockUpdateOne.mockResolvedValue(mockUpdateResult);

      const result = await updateMeetingRecording('test-meeting-id', updateData as any);

      expect(mockCollection).toHaveBeenCalledWith('meeting_recordings');
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { meeting_id: 'test-meeting-id' },
        { $set: updateData }
      );
      expect(result).toEqual(mockUpdateResult);
    });
  });

  describe('deleteMeetingRecording', () => {
    it('should delete a meeting recording', async () => {
      const mockDeleteResult = { deletedCount: 1 };
      mockDeleteOne.mockResolvedValue(mockDeleteResult);

      const result = await deleteMeetingRecording('test-meeting-id');

      expect(mockCollection).toHaveBeenCalledWith('meeting_recordings');
      expect(mockDeleteOne).toHaveBeenCalledWith({ meeting_id: 'test-meeting-id' });
      expect(result).toEqual(mockDeleteResult);
    });
  });
});
