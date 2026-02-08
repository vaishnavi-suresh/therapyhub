import { Schema, model, Document } from 'mongoose';

export interface Homework extends Document {
    homework_id: string;
    homework_title: string;
    homework_prompt: string;
    homework_response: string | null;
    homework_status: ['pending', 'completed', 'archived'];
    homework_created_at: Date;
    homework_updated_at: Date;
}

const homeworkSchema = new Schema({
    homework_id: { type: String, required: true },
    homework_title: { type: String, required: true },
    homework_prompt: { type: String, required: true },
    homework_response: { type: String, required: false },
    homework_status: { type: String, required: true },
    homework_created_at: { type: Date, required: true },
    homework_updated_at: { type: Date, required: true },
});

const Homework = model<Homework>('Homework', homeworkSchema);

export { Homework };