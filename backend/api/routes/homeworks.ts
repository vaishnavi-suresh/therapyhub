import { Router } from 'express';
import { getHomeworkController, getAllHomeworksController, createHomeworkController, updateHomeworkController, deleteHomeworkController } from '../controllers/homeworks';

const homeworksRouter = Router();

homeworksRouter.get('/:user_id/:therapist_id/:homework_id', getHomeworkController);
homeworksRouter.get('/:user_id/:therapist_id', getAllHomeworksController);
homeworksRouter.post('/:user_id/:therapist_id', createHomeworkController);
homeworksRouter.put('/:user_id/:therapist_id/:homework_id', updateHomeworkController);
homeworksRouter.delete('/:user_id/:therapist_id/:homework_id', deleteHomeworkController);

export { homeworksRouter };