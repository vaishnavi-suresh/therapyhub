import { Schema, model, Document } from 'mongoose';

export interface TherabotConversation extends Document {
    conversation_id: string;
    user_id: string;
    therapist_id: string;
    message_ids: string[];
    status: 'open' | 'closed';
    conversation_created_at: Date;
    conversation_updated_at: Date;
}

const therabotConversationSchema = new Schema({
    conversation_id: { type: String, required: true },
    user_id: { type: String, required: true },
    therapist_id: { type: String, required: true },
    status: { type: String, required: true },
    conversation_created_at: { type: Date, required: true },
    conversation_updated_at: { type: Date, required: true },
    message_ids: { type: [String], required: true },
});

const TherabotConversation = model<TherabotConversation>('TherabotConversation', therabotConversationSchema, 'therabot_conversations');

export { TherabotConversation };
