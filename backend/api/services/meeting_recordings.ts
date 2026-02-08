import { MeetingRecording } from '../models/MeetingRecording';
import { v4 as uuidv4 } from 'uuid';
import mongoClient from '../config/mongo';
import dotenv from 'dotenv';
dotenv.config();

const db = mongoClient.db(process.env.DB_NAME);
const meetingRecordingsCollection = db.collection<MeetingRecording>('meeting_recordings');

const createMeetingRecording = async (meetingRecording: MeetingRecording) => {
    // Use native MongoDB client for consistency with other functions
    const result = await meetingRecordingsCollection.insertOne(meetingRecording as any);
    const createdRecording = await meetingRecordingsCollection.findOne({ _id: result.insertedId });
    return createdRecording as MeetingRecording;
};

const getMeetingRecordings = async (user_id: string, therapist_id: string) => {
    const meetingRecordings = await meetingRecordingsCollection
        .find({ user_id, therapist_id })
        .toArray();
    return meetingRecordings;
};

const getMeetingRecording = async (meeting_recording_id: string) => {
    const meetingRecording = await meetingRecordingsCollection
        .findOne({ meeting_id: meeting_recording_id });
    return meetingRecording;
};

const updateMeetingRecording = async (meeting_recording_id: string, meetingRecording: MeetingRecording) => {
    const updatedMeetingRecording = await meetingRecordingsCollection
        .updateOne({ meeting_id: meeting_recording_id }, { $set: meetingRecording });
    return updatedMeetingRecording;
};

const deleteMeetingRecording = async (meeting_recording_id: string) => {
    const deletedMeetingRecording = await meetingRecordingsCollection
        .deleteOne({ meeting_id: meeting_recording_id });
    return deletedMeetingRecording;
};

export { createMeetingRecording, getMeetingRecordings, getMeetingRecording, updateMeetingRecording, deleteMeetingRecording };