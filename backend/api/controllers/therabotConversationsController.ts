import { Request, Response } from 'express';
import {
    getTherabotConversation,
    getTherabotConversationsByUserId,
    createTherabotConversation,
    updateTherabotConversation,
    deleteTherabotConversation,
} from '../services/therabot_conversations';
import { TherabotConversation } from '../models/TherabotConversation';
import { v4 as uuidv4 } from 'uuid';

const getClientTherabotConversationsController = async (req: Request, res: Response) => {
    const clientUserId = req.params.user_id;
    const therapistId = (req as any).user?.userId;
    if (!therapistId) return res.status(401).json({ message: 'Unauthorized' });
    const { getUser } = await import('../services/users');
    const client = await getUser(clientUserId as string);
    if (!client || client.therapist_id !== therapistId) return res.status(403).json({ message: 'Forbidden' });
    const conversations = await getTherabotConversationsByUserId(clientUserId as string);
    res.json(conversations);
};

const getMyTherabotConversationsController = async (req: Request, res: Response) => {
    const sub = (req as any).user?.sub;
    if (!sub) return res.status(401).json({ message: 'Unauthorized' });
    const { getUserByExternalAuthId } = await import('../services/users');
    const user = await getUserByExternalAuthId(sub);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const conversations = await getTherabotConversationsByUserId(user.user_id);
    res.json(conversations);
};

const getTherabotConversationController = async (req: Request, res: Response) => {
    const { conversation_id } = req.params;
    const conversation = await getTherabotConversation(conversation_id as string);
    res.json(conversation);
};

const createTherabotConversationController = async (req: Request, res: Response) => {
    const { user_id, therapist_id } = req.body;
    const payload = {
        conversation_id: uuidv4(),
        user_id: user_id as string,
        therapist_id: therapist_id as string,
        status: 'open' as const,
        message_ids: [] as string[],
        conversation_created_at: new Date(),
        conversation_updated_at: new Date(),
    };
    await createTherabotConversation(payload as any);
    res.json(payload);
};

const updateTherabotConversationController = async (req: Request, res: Response) => {
    const { conversation_id } = req.params;
    const { user_id, therapist_id } = req.body;
    const payload = { user_id, therapist_id } as Partial<TherabotConversation>;
    await updateTherabotConversation(conversation_id as string, payload);
    const conversation = await getTherabotConversation(conversation_id as string);
    res.json(conversation);
};

const deleteTherabotConversationController = async (req: Request, res: Response) => {
    const { conversation_id } = req.params;
    const deletedCount = await deleteTherabotConversation(conversation_id as string);
    res.json(deletedCount);
};

const closeTherabotConversationController = async (req: Request, res: Response) => {
    const { conversation_id } = req.params;
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const conversation = await getTherabotConversation(conversation_id as string);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (conversation.user_id !== userId) return res.status(403).json({ message: 'Forbidden' });
    const status = (conversation as any).status;
    const carePlanId = (conversation as any).care_plan_id;
    if (status === 'closed' || carePlanId) return res.status(400).json({ message: 'Conversation already closed' });

    await updateTherabotConversation(conversation_id, { status: 'closed' as const, conversation_updated_at: new Date() });

    res.json({ conversationClosed: true });
};

export {
    getMyTherabotConversationsController,
    getClientTherabotConversationsController,
    getTherabotConversationController,
    createTherabotConversationController,
    updateTherabotConversationController,
    deleteTherabotConversationController,
    closeTherabotConversationController,
};
