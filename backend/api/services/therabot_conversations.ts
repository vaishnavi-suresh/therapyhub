import mongoClient from '../config/mongo';
import { TherabotConversation } from '../models/TherabotConversation';
import dotenv from 'dotenv';
dotenv.config();

const db = mongoClient.db(process.env.DB_NAME);
const therabotConversationCollection = db.collection<TherabotConversation>('therabot_conversations');
const legacyConversationCollection = db.collection('conversations');

const getTherabotConversation = async (conversation_id: string) => {
    const conversation = await therabotConversationCollection.findOne({ conversation_id });
    if (conversation) return conversation;
    return legacyConversationCollection.findOne({ conversation_id }) as Promise<TherabotConversation | null>;
};

const getTherabotConversationsByUserId = async (user_id: string) => {
    const [therabot, legacy] = await Promise.all([
        therabotConversationCollection.find({ user_id }).sort({ conversation_created_at: -1 }).toArray(),
        legacyConversationCollection.find({ user_id }).sort({ conversation_created_at: -1 }).toArray(),
    ]);
    const seen = new Set(therabot.map((c) => c.conversation_id));
    const merged = [...therabot];
    for (const c of legacy) {
        if (!seen.has((c as any).conversation_id)) {
            seen.add((c as any).conversation_id);
            merged.push(c as any);
        }
    }
    merged.sort((a, b) => new Date(b.conversation_created_at).getTime() - new Date(a.conversation_created_at).getTime());
    return merged;
};

const createTherabotConversation = async (conversation: TherabotConversation) => {
    const result = await therabotConversationCollection.insertOne(conversation);
    return result.insertedId;
};

const updateTherabotConversation = async (conversation_id: string, conversation: Partial<TherabotConversation>) => {
    const result = await therabotConversationCollection.updateOne({ conversation_id }, { $set: conversation });
    return result.modifiedCount;
};

const deleteTherabotConversation = async (conversation_id: string) => {
    const result = await therabotConversationCollection.deleteOne({ conversation_id });
    return result.deletedCount;
};

export {
    getTherabotConversation,
    getTherabotConversationsByUserId,
    createTherabotConversation,
    updateTherabotConversation,
    deleteTherabotConversation,
};
