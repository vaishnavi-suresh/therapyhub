import { Router } from 'express';
import { getMyConversationsController, getConversationController, createConversationController, updateConversationController, deleteConversationController, closeConversationController } from '../controllers/conversationsController';
import { checkJwt, enrichUserFromDb, requiredRoles, requiredUserId, requireUserOrTherapist } from '../../middleware/auth';

const conversationRouter = Router();

conversationRouter.get('/me', checkJwt, getMyConversationsController);
conversationRouter.get('/:conversation_id', checkJwt, enrichUserFromDb, requiredRoles('user'), requireUserOrTherapist, getConversationController);
conversationRouter.post('/', checkJwt, enrichUserFromDb, requiredRoles('user'), createConversationController);
conversationRouter.post('/:conversation_id/close', checkJwt, enrichUserFromDb, requiredRoles('user'), closeConversationController);
conversationRouter.put('/:conversation_id', checkJwt, enrichUserFromDb, requiredRoles('user'), requiredUserId, updateConversationController);
conversationRouter.delete('/:conversation_id', checkJwt, enrichUserFromDb, requiredRoles('user'), requiredUserId, deleteConversationController);

export default conversationRouter;