import { Router } from 'express';
import { getCarePlanController, createCarePlanController, updateCarePlanController, deleteCarePlanController } from '../controllers/carePlanController';
import { checkJwt, requiredRoles, requiredUserId, requireUserOrTherapist } from '../../middleware/auth';

const carePlanRouter = Router();

carePlanRouter.get('/:care_plan_id', checkJwt, requiredRoles('therapist'), requiredUserId, getCarePlanController);
carePlanRouter.post('/', checkJwt, requiredRoles('user'), requiredUserId, createCarePlanController); // user because only the LLM can create a care plan
carePlanRouter.put('/:care_plan_id', checkJwt, requiredRoles('therapist'), requiredUserId, updateCarePlanController);
carePlanRouter.delete('/:care_plan_id', checkJwt, requiredRoles('therapist'), requiredUserId, deleteCarePlanController);

export default carePlanRouter;