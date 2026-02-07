import { Request, Response, Router } from 'express';
import { checkJwt, enrichUserFromDb, requiredRoleIn, requiredRoles, requiredUserId, requireUserOrTherapist } from '../../middleware/auth';
import { Message } from '../models/Message';
import { getMessagesController, getMessageController, createMessageController, updateMessageController, deleteMessageController } from '../controllers/messageController';

const messageRouter = Router();

messageRouter.get('/:user_id/:conversation_id/messages', checkJwt, enrichUserFromDb, requiredRoleIn('user', 'therapist'), requireUserOrTherapist, getMessagesController);
messageRouter.get('/:user_id/:conversation_id/messages/:message_id', checkJwt, enrichUserFromDb, requiredRoleIn('user', 'therapist'), requireUserOrTherapist, getMessageController);
messageRouter.post('/:user_id/:conversation_id/messages', checkJwt, enrichUserFromDb, requiredRoles('user'), requiredUserId, createMessageController);
messageRouter.put('/:user_id/:conversation_id/messages/:message_id', checkJwt, enrichUserFromDb, requiredRoles('user'), requiredUserId, updateMessageController);
messageRouter.delete('/:user_id/:conversation_id/messages/:message_id', checkJwt, enrichUserFromDb, requiredRoles('user'), requiredUserId, deleteMessageController);

export default messageRouter;
