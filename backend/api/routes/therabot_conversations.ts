import { Router } from 'express';
import {
    getMyTherabotConversationsController,
    getClientTherabotConversationsController,
    getTherabotConversationController,
    createTherabotConversationController,
    updateTherabotConversationController,
    deleteTherabotConversationController,
    closeTherabotConversationController,
} from '../controllers/therabotConversationsController';
import {
    checkJwt,
    enrichUserFromDb,
    requiredRoles,
    requiredUserId,
    requireUserOrTherapist,
} from '../../middleware/auth';

const therabotConversationsRouter = Router();

therabotConversationsRouter.get('/me', checkJwt, getMyTherabotConversationsController);
therabotConversationsRouter.get(
    '/client/:user_id',
    checkJwt,
    enrichUserFromDb,
    requiredRoles('therapist'),
    getClientTherabotConversationsController
);
therabotConversationsRouter.get(
    '/:conversation_id',
    checkJwt,
    enrichUserFromDb,
    requiredRoles('user'),
    requireUserOrTherapist,
    getTherabotConversationController
);
therabotConversationsRouter.post('/', checkJwt, enrichUserFromDb, requiredRoles('user'), createTherabotConversationController);
therabotConversationsRouter.post(
    '/:conversation_id/close',
    checkJwt,
    enrichUserFromDb,
    requiredRoles('user'),
    closeTherabotConversationController
);
therabotConversationsRouter.put(
    '/:conversation_id',
    checkJwt,
    enrichUserFromDb,
    requiredRoles('user'),
    requiredUserId,
    updateTherabotConversationController
);
therabotConversationsRouter.delete(
    '/:conversation_id',
    checkJwt,
    enrichUserFromDb,
    requiredRoles('user'),
    requiredUserId,
    deleteTherabotConversationController
);

export default therabotConversationsRouter;
