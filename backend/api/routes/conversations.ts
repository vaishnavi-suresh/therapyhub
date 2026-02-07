import { Router } from 'express';
import { getConversationController, createConversationController, updateConversationController, deleteConversationController } from '../controllers/conversationsController';
import { checkJwt, requiredRoles, requiredUserId, requireUserOrTherapist } from '../../middleware/auth';

const conversationRouter = Router();

conversationRouter.get('/:conversation_id', checkJwt, requiredRoles('user'), requireUserOrTherapist, getConversationController);
conversationRouter.post('/', checkJwt, requiredRoles('user'), requiredUserId, createConversationController);
conversationRouter.put('/:conversation_id', checkJwt, requiredRoles('user'), requiredUserId, updateConversationController);
conversationRouter.delete('/:conversation_id', checkJwt, requiredRoles('user'), requiredUserId, deleteConversationController);

export default conversationRouter;