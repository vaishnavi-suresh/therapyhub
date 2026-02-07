import { Request, Response } from 'express';
import { getConversation, getConversationsByUserId, createConversation, updateConversation, deleteConversation } from '../services/conversations';
import { getMessages } from '../services/message';
import { createCarePlan } from '../services/careplans';
import { createCarePlan as createCarePlanFromMessages } from '../../utils/genAI';
import { Conversation } from '../models/Conversation';
import { CarePlan } from '../models/CarePlan';
import { v4 as uuidv4 } from 'uuid';

const getMyConversationsController = async (req: Request, res: Response) => {
    const sub = (req as any).user?.sub;
    if (!sub) return res.status(401).json({ message: 'Unauthorized' });
    const { getUserByExternalAuthId } = await import('../services/users');
    const user = await getUserByExternalAuthId(sub);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const conversations = await getConversationsByUserId(user.user_id);
    res.json(conversations);
};

const getConversationController = async (req: Request, res: Response) => {
    const { conversation_id } = req.params;
    const conversation = await getConversation(conversation_id as string);
    res.json(conversation);
};

const createConversationController = async (req: Request, res: Response) => {
    const { user_id, therapist_id,  } = req.body;
    const payload = new Conversation({
        conversation_id: uuidv4(),
        user_id: user_id as string,
        therapist_id: therapist_id as string,
        care_plan_id: null,
        message_ids: [],
        conversation_created_at: new Date(),
        conversation_updated_at: new Date(),
    });
    await createConversation(payload);
    res.json(payload);
};

const updateConversationController = async (req: Request, res: Response) => {
    const { conversation_id } = req.params;
    const { user_id, therapist_id } = req.body;
    const payload = new Conversation({
        conversation_id: conversation_id as string,
        user_id: user_id as string,
        therapist_id: therapist_id as string,
    });
    const conversation = await updateConversation(conversation_id as string, payload);
    res.json(conversation);
};

const deleteConversationController = async (req: Request, res: Response) => {
    const { conversation_id } = req.params;
    const conversation = await deleteConversation(conversation_id as string);
    res.json(conversation);
};

const closeConversationController = async (req: Request, res: Response) => {
    const { conversation_id } = req.params;
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const conversation = await getConversation(conversation_id as string);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (conversation.user_id !== userId) return res.status(403).json({ message: 'Forbidden' });
    if (conversation.care_plan_id) return res.status(400).json({ message: 'Conversation already closed with a care plan' });

    const messages = await getMessages(conversation.user_id, conversation_id);
    if (messages.length === 0) return res.status(400).json({ message: 'No messages to generate a care plan from' });

    const history = messages.map((m) =>
        (m.role as string) === 'user' ? `User: ${m.message_content}` : `Harbor: ${m.message_content}`
    );

    let carePlanText: string;
    try {
        carePlanText = await createCarePlanFromMessages(history);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Failed to generate care plan' });
    }

    const carePlanId = uuidv4();
    const payload = new CarePlan({
        care_plan_id: carePlanId,
        user_id: conversation.user_id,
        therapist_id: conversation.therapist_id,
        conversation_id: conversation_id,
        care_plan_description: carePlanText,
        care_plan_created_at: new Date(),
        care_plan_updated_at: new Date(),
    });
    await createCarePlan(payload);

    await updateConversation(conversation_id, { care_plan_id: carePlanId } as any);

    res.json({ care_plan_id: carePlanId, care_plan_description: carePlanText });
};

export { getMyConversationsController, getConversationController, createConversationController, updateConversationController, deleteConversationController, closeConversationController };