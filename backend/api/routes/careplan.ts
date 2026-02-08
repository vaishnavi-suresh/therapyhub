import { Router } from 'express';
import { getCarePlanController, getCarePlansForClientController, createCarePlanController, updateCarePlanController, deleteCarePlanController, createCarePlanFromDataController } from '../controllers/carePlanController';
import { checkJwt, enrichUserFromDb, requiredRoles, requiredUserId, requireUserOrTherapist } from '../../middleware/auth';

const carePlanRouter = Router();

carePlanRouter.get('/client/:user_id', checkJwt, enrichUserFromDb, requiredRoles('therapist'), getCarePlansForClientController);
carePlanRouter.post('/generate', checkJwt, enrichUserFromDb, requiredRoles('therapist'), createCarePlanFromDataController);
carePlanRouter.get('/:care_plan_id', checkJwt, enrichUserFromDb, requiredRoles('therapist'), getCarePlanController);
carePlanRouter.post('/', checkJwt, requiredRoles('user'), requiredUserId, createCarePlanController); // user because only the LLM can create a care plan
carePlanRouter.put('/:care_plan_id', checkJwt, requiredRoles('therapist'), requiredUserId, updateCarePlanController);
carePlanRouter.delete('/:care_plan_id', checkJwt, requiredRoles('therapist'), requiredUserId, deleteCarePlanController);


export default carePlanRouter;