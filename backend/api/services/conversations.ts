import mongoClient from '../config/mongo';
import { Conversation } from '../models/Conversation';
import dotenv from 'dotenv';
dotenv.config();

const db = mongoClient.db(process.env.DB_NAME);
const conversationCollection = db.collection<Conversation>('conversations');

const getConversation = async (conversation_id: string) => {
    const conversation = await conversationCollection.findOne({conversation_id});
    return conversation;
};

const createConversation = async (conversation: Conversation) => {
    const result = await conversationCollection.insertOne(conversation);
    return result.insertedId;
};

const updateConversation = async (conversation_id: string, conversation: Conversation) => {
    const result = await conversationCollection.updateOne({conversation_id}, {$set: conversation});
    return result.modifiedCount;
};

const deleteConversation = async (conversation_id: string) => {
    const result = await conversationCollection.deleteOne({conversation_id});
    return result.deletedCount;
};

export { getConversation, createConversation, updateConversation, deleteConversation };