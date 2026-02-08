jest.mock('../../api/config/mongo', () => {
  const toArray = jest.fn();
  const m = {
    findOne: jest.fn(),
    find: jest.fn(() => ({ toArray })),
    insertOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };
  (global as any).__meetingRecordingsServiceMocks = { ...m, toArray };
  return {
    __esModule: true,
    default: {
      db: jest.fn(() => ({
        collection: jest.fn(() => m),
      })),
    },
  };
});

import {
  createMeetingRecording,
  getMeetingRecordings,
  getMeetingRecording,
  updateMeetingRecording,
  deleteMeetingRecording,
} from '../../api/services/meeting_recordings';
import mongoClient from '../../api/config/mongo';

describe('Meeting Recordings Service', () => {
  let mockCollection: any;
  let mockDb: any;
  let mockMongoClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMongoClient = mongoClient as any;
    mockDb = { collection: jest.fn() };
    mockCollection = {
      findOne: jest.fn(),
      find: jest.fn(),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
    };
    mockMongoClient.db = jest.fn(() => mockDb);
    mockDb.collection = jest.fn(() => mockCollection);
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
      mockCollection.insertOne.mockResolvedValue(mockInsertedId);
      mockCollection.findOne.mockResolvedValue(mockRecording);

      const result = await createMeetingRecording(mockRecording as any);

      expect(mockCollection.insertOne).toHaveBeenCalledWith(mockRecording);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: mockInsertedId.insertedId });
      expect(result).toEqual(mockRecording);
    });
  });

  describe('getMeetingRecordings', () => {
    it('should get all meeting recordings for user and therapist', async () => {
      const mockRecordings = [
        { meeting_id: 'meeting1', user_id: 'user1', therapist_id: 'therapist1' },
        { meeting_id: 'meeting2', user_id: 'user1', therapist_id: 'therapist1' },
      ];

      const mockFind = {
        toArray: jest.fn().mockResolvedValue(mockRecordings),
      };
      mockCollection.find.mockReturnValue(mockFind);

      const result = await getMeetingRecordings('user1', 'therapist1');

      expect(mockCollection.find).toHaveBeenCalledWith({ user_id: 'user1', therapist_id: 'therapist1' });
      expect(mockFind.toArray).toHaveBeenCalled();
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

      mockCollection.findOne.mockResolvedValue(mockRecording);

      const result = await getMeetingRecording('test-meeting-id');

      expect(mockCollection.findOne).toHaveBeenCalledWith({ meeting_id: 'test-meeting-id' });
      expect(result).toEqual(mockRecording);
    });

    it('should return null if recording not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

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
      mockCollection.updateOne.mockResolvedValue(mockUpdateResult);

      const result = await updateMeetingRecording('test-meeting-id', updateData as any);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { meeting_id: 'test-meeting-id' },
        { $set: updateData }
      );
      expect(result).toEqual(mockUpdateResult);
    });
  });

  describe('deleteMeetingRecording', () => {
    it('should delete a meeting recording', async () => {
      const mockDeleteResult = { deletedCount: 1 };
      mockCollection.deleteOne.mockResolvedValue(mockDeleteResult);

      const result = await deleteMeetingRecording('test-meeting-id');

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ meeting_id: 'test-meeting-id' });
      expect(result).toEqual(mockDeleteResult);
    });
  });
});
