import { Schema, model, Document } from 'mongoose';

interface Conversation extends Document {
    conversation_id: string;
    user_id: string;
    therapist_id: string;
    care_plan_id: string | null;
    message_ids: string[];
    conversation_created_at: Date;
    conversation_updated_at: Date;
}

const conversationSchema = new Schema({
    conversation_id: { type: String, required: true },
    user_id: { type: String, required: true },
    therapist_id: { type: String, required: true },
    care_plan_id: { type: String, required: true },
    conversation_created_at: { type: Date, required: true },
    conversation_updated_at: { type: Date, required: true },
    message_ids: { type: [String], required: true },
});

const Conversation = model<Conversation>('Conversation', conversationSchema);

export { Conversation };