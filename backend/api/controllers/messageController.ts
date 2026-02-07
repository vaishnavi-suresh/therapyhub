import { Request, Response } from 'express';
import { Message } from '../models/Message';
import { getMessages, getMessage, createMessage, updateMessage, deleteMessage } from '../services/message';
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
    const { user_id, conversation_id, message_content, role, therapist_id } = req.body;
    const payload = new Message({
        message_id: uuidv4(),
        conversation_id: conversation_id as string,
        user_id: user_id as string,
        role: role as ['user', 'bot'],
        therapist_id: therapist_id as string,
        message_content: message_content as string,
        message_created_at: new Date(),
    });
    const message = await createMessage(payload);
    res.json(message);
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