import mongoClient from '../api/config/mongo';
import dotenv from 'dotenv';
dotenv.config();

const db = mongoClient.db(process.env.DB_NAME);

export const getMessagesFromLastWeek = async (user_id?: string, therapist_id?: string) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const filter: Record<string, unknown> = { message_created_at: { $gte: oneWeekAgo } };
    if (user_id) filter.user_id = user_id;
    if (therapist_id) filter.therapist_id = therapist_id;
    return db.collection('therabot_messages').find(filter).toArray();
};

export const getHomeworksFromLastWeek = async (user_id?: string, therapist_id?: string) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const filter: Record<string, unknown> = { homework_created_at: { $gte: oneWeekAgo } };
    if (user_id) filter.user_id = user_id;
    if (therapist_id) filter.therapist_id = therapist_id;
    return db.collection('homeworks').find(filter).toArray();
};
