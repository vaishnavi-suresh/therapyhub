import { Schema, model, Document } from 'mongoose';

interface MeetingRecording extends Document {
    meeting_id: string;
    user_id: string;
    therapist_id: string;
    recording_url: string;
    recording_created_at: Date;
    transcript: string | null;
    analysis: string;

}

const meetingRecordingSchema = new Schema({
    meeting_id: { type: String, required: true },
    user_id: { type: String, required: true },
    therapist_id: { type: String, required: true },
    recording_url: { type: String, required: true },
    recording_created_at: { type: Date, required: true },
    transcript: { type: String, required: false, default: null },
    analysis: { type: String, required: true },
});

const MeetingRecording = model<MeetingRecording>('MeetingRecording', meetingRecordingSchema, 'meeting_recordings');

export { MeetingRecording };