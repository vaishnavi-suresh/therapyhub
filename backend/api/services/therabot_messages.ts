import mongoClient from '../config/mongo';
import { TherabotMessage } from '../models/TherabotMessage';
import dotenv from 'dotenv';
dotenv.config();

const db = mongoClient.db(process.env.DB_NAME);
const therabotMessageCollection = db.collection<TherabotMessage>('therabot_messages');
const legacyMessageCollection = db.collection('messages');

const getTherabotMessages = async (user_id: string, conversation_id: string) => {
    const [therabot, legacy] = await Promise.all([
        therabotMessageCollection.find({ user_id, conversation_id }).toArray(),
        legacyMessageCollection.find({ user_id, conversation_id }).toArray(),
    ]);
    if (therabot.length > 0) return therabot;
    return legacy as TherabotMessage[];
};

const getTherabotMessage = async (user_id: string, conversation_id: string, message_id: string) => {
    const message = await therabotMessageCollection.findOne({ user_id, conversation_id, message_id });
    if (message) return message;
    return legacyMessageCollection.findOne({ user_id, conversation_id, message_id }) as Promise<TherabotMessage | null>;
};

const createTherabotMessage = async (message: TherabotMessage) => {
    const result = await therabotMessageCollection.insertOne(message);
    return result.insertedId;
};

const updateTherabotMessage = async (user_id: string, conversation_id: string, message_id: string, update: Partial<TherabotMessage>) => {
    const result = await therabotMessageCollection.updateOne({ user_id, conversation_id, message_id }, { $set: update });
    return result.modifiedCount;
};

const deleteTherabotMessage = async (user_id: string, conversation_id: string, message_id: string) => {
    const result = await therabotMessageCollection.deleteOne({ user_id, conversation_id, message_id });
    return result.deletedCount;
};

export {
    getTherabotMessages,
    getTherabotMessage,
    createTherabotMessage,
    updateTherabotMessage,
    deleteTherabotMessage,
};
