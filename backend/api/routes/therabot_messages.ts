import { Router } from 'express';
import {
    checkJwt,
    enrichUserFromDb,
    requiredRoleIn,
    requiredRoles,
    requiredUserId,
    requireUserOrTherapist,
} from '../../middleware/auth';
import {
    getTherabotMessagesController,
    getTherabotMessageController,
    createTherabotMessageController,
    updateTherabotMessageController,
    deleteTherabotMessageController,
} from '../controllers/therabotMessagesController';

const therabotMessagesRouter = Router();

therabotMessagesRouter.get(
    '/:user_id/:conversation_id/therabot_messages',
    checkJwt,
    enrichUserFromDb,
    requiredRoleIn('user', 'therapist'),
    requireUserOrTherapist,
    getTherabotMessagesController
);
therabotMessagesRouter.get(
    '/:user_id/:conversation_id/therabot_messages/:message_id',
    checkJwt,
    enrichUserFromDb,
    requiredRoleIn('user', 'therapist'),
    requireUserOrTherapist,
    getTherabotMessageController
);
therabotMessagesRouter.post(
    '/:user_id/:conversation_id/therabot_messages',
    checkJwt,
    enrichUserFromDb,
    requiredRoles('user'),
    requiredUserId,
    createTherabotMessageController
);
therabotMessagesRouter.put(
    '/:user_id/:conversation_id/therabot_messages/:message_id',
    checkJwt,
    enrichUserFromDb,
    requiredRoles('user'),
    requiredUserId,
    updateTherabotMessageController
);
therabotMessagesRouter.delete(
    '/:user_id/:conversation_id/therabot_messages/:message_id',
    checkJwt,
    enrichUserFromDb,
    requiredRoles('user'),
    requiredUserId,
    deleteTherabotMessageController
);

export default therabotMessagesRouter;
