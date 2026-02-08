// Shared session storage for meeting recordings
const sessions = new Map<string, { user_id: string; therapist_id: string }>();

export function setSession(meetingId: string, user_id: string, therapist_id: string): void {
  sessions.set(meetingId, { user_id, therapist_id });
}

export function getSession(meetingId: string): { user_id: string; therapist_id: string } | undefined {
  return sessions.get(meetingId);
}

export function getSessionByParticipants(user_id: string, therapist_id: string): string | undefined {
  for (const [id, s] of sessions.entries()) {
    if (s.user_id === user_id && s.therapist_id === therapist_id) return id;
  }
  return undefined;
}

export function deleteSession(meetingId: string): void {
  sessions.delete(meetingId);
}
