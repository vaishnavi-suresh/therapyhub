import { Schema, model, Document } from 'mongoose';

interface Message extends Document {
    message_id: string;
    conversation_id: string;
    user_id: string;
    role: 'user' | 'bot';
    therapist_id: string;
    message_content: string;
    message_created_at: Date;
}

const messageSchema = new Schema({
    message_id: { type: String, required: true },
    conversation_id: { type: String, required: true },
    user_id: { type: String, required: true },
    role: { type: String, required: true },
    therapist_id: { type: String, required: true },
    message_content: { type: String, required: true },
    message_created_at: { type: Date, required: true },
});

const Message = model<Message>('Message', messageSchema);

export { Message };