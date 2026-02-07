import { Request, Response } from 'express';
import { Message } from '../models/Message';
import { getMessages, getMessage, createMessage, updateMessage, deleteMessage } from '../services/message';
import { createTherapistBotResponse } from '../../utils/genAI';
import { v4 as uuidv4 } from 'uuid';

const getMessagesController = async (req: Request, res: Response) => {
    const { user_id, conversation_id } = req.params;
    const messages = await getMessages(user_id, conversation_id);
    res.json(messages);
};

const getMessageController = async (req: Request, res: Response) => {
    const { user_id, conversation_id, message_id } = req.params;
    const message = await getMessage(user_id, conversation_id, message_id);
    res.json(message);
};

const createMessageController = async (req: Request, res: Response) => {
    const { user_id, conversation_id } = req.params;
    const { message_content, role, therapist_id } = req.body;

    if ((role as string) === 'bot') {
        const botMessage = new Message({
            message_id: uuidv4(),
            conversation_id: conversation_id as string,
            user_id: user_id as string,
            role: 'bot' as const,
            therapist_id: therapist_id as string,
            message_content: message_content as string,
            message_created_at: new Date(),
        });
        await createMessage(botMessage);
        return res.json(botMessage);
    }

    const userMessage = new Message({
        message_id: uuidv4(),
        conversation_id: conversation_id as string,
        user_id: user_id as string,
        role: 'user' as const,
        therapist_id: therapist_id as string,
        message_content: message_content as string,
        message_created_at: new Date(),
    });
    await createMessage(userMessage);

    const existingMessages = await getMessages(user_id as string, conversation_id);
    const history = existingMessages.map((m) =>
        (m.role as string) === 'user' ? `User: ${m.message_content}` : `Harbor: ${m.message_content}`
    );

    let botContent: string;
    try {
        botContent = (await createTherapistBotResponse(history)) ?? 'I\'m here to listen. Could you tell me more?';
    } catch (error) {
        console.error(error);
        botContent = 'I\'m having trouble responding right now. Please try again in a moment.';
    }

    const botMessage = new Message({
        message_id: uuidv4(),
        conversation_id: conversation_id as string,
        user_id: user_id as string,
        role: 'bot' as const,
        therapist_id: therapist_id as string,
        message_content: botContent,
        message_created_at: new Date(),
    });
    await createMessage(botMessage);

    res.json({ userMessage: userMessage, botMessage: botMessage });
};

const updateMessageController = async (req: Request, res: Response) => {
    const { user_id, conversation_id, message_id } = req.params;
    const { message_content } = req.body;
    const message = await updateMessage(user_id, conversation_id, message_id, message_content);
    res.json(message);
};

const deleteMessageController = async (req: Request, res: Response) => {
    const { user_id, conversation_id, message_id } = req.params;
    const message = await deleteMessage(user_id, conversation_id, message_id);
    res.json(message);
};

export { getMessagesController, getMessageController, createMessageController, updateMessageController, deleteMessageController };