import { Router } from 'express';
import { createUserController, updateUserController, deleteUserController, getUserController, getAllUsersController, getAllTherapistsController, getTherapistByEmailController, addClientToTherapistController, getMeController } from '../controllers/userController';
import { checkJwt, requiredRoles, requiredUserId, requireUserOrTherapist } from '../../middleware/auth';

const userRouter = Router();

userRouter.get('/me', checkJwt, getMeController);
userRouter.post('/', checkJwt, createUserController);
userRouter.get('/therapists', checkJwt, getAllTherapistsController);
userRouter.get('/therapists/:email', checkJwt, getTherapistByEmailController);
userRouter.post('/therapists/add-client', checkJwt, addClientToTherapistController);
userRouter.put('/:user_id', checkJwt, requiredRoles('user'), requiredUserId, updateUserController);
userRouter.delete('/:user_id', checkJwt, requiredRoles('user'), requiredUserId, deleteUserController);
userRouter.get('/:user_id', checkJwt, requireUserOrTherapist, getUserController);

export default userRouter;