import { Schema, model, Document } from 'mongoose';

interface User extends Document {
    user_id: string;
    external_auth_id: string;
    email: string;
    therapist_id: string | null;
    client_ids: string[];
    first_name: string;
    last_name: string;
    created_at: Date;
    updated_at: Date;
    role: ['user', 'therapist', 'admin'];
}


const userSchema = new Schema({
    user_id: { type: String, required: true },
    external_auth_id: { type: String, required: true },
    email: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    created_at: { type: Date, required: true },
    updated_at: { type: Date, required: true },
    role: { type: String, required: true },
});

const User = model<User>('User', userSchema);

export { User };