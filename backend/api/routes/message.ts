import { Request, Response, Router } from 'express';
import { checkJwt, requiredRoles, requiredUserId } from '../../middleware/auth';
import { Message } from '../models/Message';
import { getMessagesController, getMessageController, createMessageController, updateMessageController, deleteMessageController } from '../controllers/messageController';

const messageRouter = Router();

messageRouter.get('/:user_id/:conversation_id/messages', checkJwt, requiredRoles('user'), requiredUserId, getMessagesController);
messageRouter.get('/:user_id/:conversation_id/messages/:message_id', checkJwt, requiredRoles('user'), requiredUserId, getMessageController);
messageRouter.post('/:user_id/:conversation_id/messages', checkJwt, requiredRoles('user'), requiredUserId, createMessageController);
messageRouter.put('/:user_id/:conversation_id/messages/:message_id', checkJwt, requiredRoles('user'), requiredUserId, updateMessageController);
messageRouter.delete('/:user_id/:conversation_id/messages/:message_id', checkJwt, requiredRoles('user'), requiredUserId, deleteMessageController);

export default messageRouter;
