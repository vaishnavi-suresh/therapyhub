import { Request, Response } from 'express';
import { getConversation, createConversation, updateConversation, deleteConversation } from '../services/conversations';
import { Conversation } from '../models/Conversation';
import { v4 as uuidv4 } from 'uuid';

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
    const conversation = await createConversation(payload);
    res.json(conversation);
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

export { getConversationController, createConversationController, updateConversationController, deleteConversationController };