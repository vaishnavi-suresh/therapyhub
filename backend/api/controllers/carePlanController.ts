import { Request, Response } from 'express';
import { getCarePlan, getCarePlansByUserAndTherapist, createCarePlan, updateCarePlan, deleteCarePlan } from '../services/careplans';
import { CarePlan } from '../models/CarePlan';
import { createCarePlanFromData } from '../../utils/genAI';
import { getMessagesFromLastWeek as getMessagesFromLastWeekUtil, getHomeworksFromLastWeek as getHomeworksFromLastWeekUtil } from '../../utils/recentData';
import { v4 as uuidv4 } from 'uuid';

const getCarePlanController = async (req: Request, res: Response) => {
    const { care_plan_id } = req.params;
    const carePlan = await getCarePlan(care_plan_id as string);
    res.json(carePlan);
};

const getCarePlansForClientController = async (req: Request, res: Response) => {
    const { user_id } = req.params;
    const therapistId = (req as any).user?.userId;
    if (!therapistId) return res.status(401).json({ message: 'Unauthorized' });
    const { getUser } = await import('../services/users');
    const client = await getUser(user_id as string);
    if (!client || client.therapist_id !== therapistId) return res.status(403).json({ message: 'Forbidden' });
    const plans = await getCarePlansByUserAndTherapist(user_id as string, therapistId);
    res.json(plans);
};

const createCarePlanController = async (req: Request, res: Response) => {
    const { user_id, therapist_id, care_plan_name, care_plan_description } = req.body;
    const payload = new CarePlan({
        care_plan_id: uuidv4(),
        user_id: user_id as string,
        therapist_id: therapist_id as string,
        care_plan_name: care_plan_name as string,
        care_plan_description: care_plan_description as string,
        care_plan_created_at: new Date(),
        care_plan_updated_at: new Date(),
    });
    const carePlan = await createCarePlan(payload);
    res.json(carePlan);
};

const getMessagesFromLastWeek = async (req: Request, res: Response) => {
    const messages = await getMessagesFromLastWeekUtil();
    res.json(messages);
};

const getHomeworksFromLastWeek = async (req: Request, res: Response) => {
    const homeworks = await getHomeworksFromLastWeekUtil();
    res.json(homeworks);
};

const createCarePlanFromDataController = async (req: Request, res: Response) => {
    const { user_id } = req.body;
    const therapistId = (req as any).user?.userId;
    if (!therapistId) return res.status(401).json({ message: 'Unauthorized' });
    if (!user_id) return res.status(400).json({ message: 'user_id is required' });
    const rawMessages = await getMessagesFromLastWeekUtil(user_id, therapistId);
    const rawHomeworks = await getHomeworksFromLastWeekUtil(user_id, therapistId);
    const messages = rawMessages.map((m: any) => (m.role === 'user' ? `User: ${m.message_content}` : `Harbor: ${m.message_content}`));
    const homeworks = rawHomeworks.map((h: any) => `${h.homework_title || ''}: ${h.homework_prompt || ''}${h.homework_response ? `\nResponse: ${h.homework_response}` : ''}`.trim());
    const carePlanText = await createCarePlanFromData(messages, homeworks as any);
    const payload = new CarePlan({
        care_plan_id: uuidv4(),
        user_id: user_id as string,
        therapist_id: therapistId,
        care_plan_description: carePlanText,
        care_plan_created_at: new Date(),
        care_plan_updated_at: new Date(),
    });
    const createdCarePlan = await createCarePlan(payload);
    res.json(createdCarePlan);
};



const updateCarePlanController = async (req: Request, res: Response) => {
    const { care_plan_id } = req.params;
    const { user_id, therapist_id, care_plan_name, care_plan_description } = req.body;
    const payload = new CarePlan({
        care_plan_id: care_plan_id as string,
        user_id: user_id as string,
        therapist_id: therapist_id as string,
        care_plan_name: care_plan_name as string,
        care_plan_description: care_plan_description as string,
        care_plan_updated_at: new Date(),
    });
    const carePlan = await updateCarePlan(care_plan_id as string, payload);
    res.json(carePlan);
};

const deleteCarePlanController = async (req: Request, res: Response) => {
    const { care_plan_id } = req.params;
    const carePlan = await deleteCarePlan(care_plan_id as string);
    res.json(carePlan);
};
export { getCarePlanController, getCarePlansForClientController, createCarePlanController, updateCarePlanController, deleteCarePlanController, getMessagesFromLastWeek, getHomeworksFromLastWeek, createCarePlanFromDataController };