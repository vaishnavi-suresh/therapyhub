import { Request, Response } from 'express';
import { TherabotMessage } from '../models/TherabotMessage';
import {
    getTherabotMessages,
    getTherabotMessage,
    createTherabotMessage,
    updateTherabotMessage,
    deleteTherabotMessage,
} from '../services/therabot_messages';
import { getTherabotConversation } from '../services/therabot_conversations';
import { createTherapistBotResponse } from '../../utils/genAI';
import { v4 as uuidv4 } from 'uuid';

const getTherabotMessagesController = async (req: Request, res: Response) => {
    const { user_id, conversation_id } = req.params;
    const messages = await getTherabotMessages(user_id, conversation_id);
    res.json(messages);
};

const getTherabotMessageController = async (req: Request, res: Response) => {
    const { user_id, conversation_id, message_id } = req.params;
    const message = await getTherabotMessage(user_id, conversation_id, message_id);
    res.json(message);
};

const createTherabotMessageController = async (req: Request, res: Response) => {
    const { user_id, conversation_id } = req.params;
    const { message_content, role, therapist_id } = req.body;

    const conversation = await getTherabotConversation(conversation_id as string);
    const status = (conversation as any)?.status;
    const carePlanId = (conversation as any)?.care_plan_id;
    if (status === 'closed' || carePlanId) {
        return res.status(403).json({ message: 'Cannot send messages to a closed conversation' });
    }

    if ((role as string) === 'bot') {
        const botMessage: TherabotMessage = {
            message_id: uuidv4(),
            conversation_id: conversation_id as string,
            user_id: user_id as string,
            role: 'bot' as const,
            therapist_id: therapist_id as string,
            message_content: message_content as string,
            message_created_at: new Date(),
        } as TherabotMessage;
        await createTherabotMessage(botMessage);
        return res.json(botMessage);
    }

    const userMessage: TherabotMessage = {
        message_id: uuidv4(),
        conversation_id: conversation_id as string,
        user_id: user_id as string,
        role: 'user' as const,
        therapist_id: therapist_id as string,
        message_content: message_content as string,
        message_created_at: new Date(),
    } as TherabotMessage;
    await createTherabotMessage(userMessage);

    const existingMessages = await getTherabotMessages(user_id as string, conversation_id);
    const history = existingMessages.map((m) =>
        (m.role as string) === 'user' ? `User: ${m.message_content}` : `Harbor: ${m.message_content}`
    );

    let botContent: string;
    try {
        botContent = (await createTherapistBotResponse(history)) ?? "I'm here to listen. Could you tell me more?";
    } catch (error) {
        console.error(error);
        botContent = "I'm having trouble responding right now. Please try again in a moment.";
    }

    const botMessage: TherabotMessage = {
        message_id: uuidv4(),
        conversation_id: conversation_id as string,
        user_id: user_id as string,
        role: 'bot' as const,
        therapist_id: therapist_id as string,
        message_content: botContent,
        message_created_at: new Date(),
    } as TherabotMessage;
    await createTherabotMessage(botMessage);

    res.json({ userMessage: userMessage, botMessage: botMessage });
};

const updateTherabotMessageController = async (req: Request, res: Response) => {
    const { user_id, conversation_id, message_id } = req.params;
    const { message_content } = req.body;
    await updateTherabotMessage(user_id, conversation_id, message_id, { message_content } as Partial<TherabotMessage>);
    const message = await getTherabotMessage(user_id, conversation_id, message_id);
    res.json(message);
};

const deleteTherabotMessageController = async (req: Request, res: Response) => {
    const { user_id, conversation_id, message_id } = req.params;
    const deletedCount = await deleteTherabotMessage(user_id, conversation_id, message_id);
    res.json(deletedCount);
};

export {
    getTherabotMessagesController,
    getTherabotMessageController,
    createTherabotMessageController,
    updateTherabotMessageController,
    deleteTherabotMessageController,
};
