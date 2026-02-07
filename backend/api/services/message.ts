import mongoClient from '../config/mongo';
import { Message } from '../models/Message';
import dotenv from 'dotenv';
dotenv.config();

const db = mongoClient.db(process.env.DB_NAME);
const messageCollection = db.collection<Message>('messages');

const getMessages = async (user_id: string, conversation_id: string) => {
    const messages = await messageCollection.find({user_id, conversation_id});
    return messages.toArray();
};

const getMessage = async (user_id: string, conversation_id: string, message_id: string) => {
    const message = await messageCollection.findOne({user_id, conversation_id, message_id});
    return message;
};

const createMessage = async (message: Message) => {
    const result = await messageCollection.insertOne(message);
    return result.insertedId;
};

const updateMessage = async (user_id: string, conversation_id: string, message_id: string, message: Message) => {
    const result = await messageCollection.updateOne({user_id, conversation_id, message_id}, {$set: message});
    return result.modifiedCount;
};

const deleteMessage = async (user_id: string, conversation_id: string, message_id: string) => {
    const result = await messageCollection.deleteOne({user_id, conversation_id, message_id});
    return result.deletedCount;
};
export { getMessages, getMessage, createMessage, updateMessage, deleteMessage };