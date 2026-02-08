import {
  setSession,
  getSession,
  getSessionByParticipants,
  deleteSession,
} from '../../api/services/meetingSession';

describe('Meeting Session Service', () => {
  beforeEach(() => {
    // Clear sessions before each test
    // Since sessions is a Map, we need to access it through the module
    // We'll test the public API
  });

  describe('setSession', () => {
    it('should set a session', () => {
      setSession('meeting1', 'user1', 'therapist1');
      const session = getSession('meeting1');
      expect(session).toEqual({ user_id: 'user1', therapist_id: 'therapist1' });
    });

    it('should overwrite existing session', () => {
      setSession('meeting1', 'user1', 'therapist1');
      setSession('meeting1', 'user2', 'therapist2');
      const session = getSession('meeting1');
      expect(session).toEqual({ user_id: 'user2', therapist_id: 'therapist2' });
    });
  });

  describe('getSession', () => {
    it('should get a session by meeting ID', () => {
      setSession('meeting1', 'user1', 'therapist1');
      const session = getSession('meeting1');
      expect(session).toEqual({ user_id: 'user1', therapist_id: 'therapist1' });
    });

    it('should return undefined for non-existent session', () => {
      const session = getSession('non-existent');
      expect(session).toBeUndefined();
    });
  });

  describe('getSessionByParticipants', () => {
    it('should get session ID by user and therapist IDs', () => {
      setSession('meeting1', 'user1', 'therapist1');
      const meetingId = getSessionByParticipants('user1', 'therapist1');
      expect(meetingId).toBe('meeting1');
    });

    it('should return undefined if no session found', () => {
      const meetingId = getSessionByParticipants('user1', 'therapist1');
      expect(meetingId).toBeUndefined();
    });

    it('should return correct session when multiple exist', () => {
      setSession('meeting1', 'user1', 'therapist1');
      setSession('meeting2', 'user2', 'therapist2');
      const meetingId = getSessionByParticipants('user2', 'therapist2');
      expect(meetingId).toBe('meeting2');
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', () => {
      setSession('meeting1', 'user1', 'therapist1');
      deleteSession('meeting1');
      const session = getSession('meeting1');
      expect(session).toBeUndefined();
    });

    it('should not throw when deleting non-existent session', () => {
      expect(() => deleteSession('non-existent')).not.toThrow();
    });
  });
});
