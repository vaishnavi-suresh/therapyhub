import { Request, Response } from 'express';
import { getCarePlan, createCarePlan, updateCarePlan, deleteCarePlan } from '../services/careplans';
import { CarePlan } from '../models/CarePlan';
import { createCarePlan as createCarePlanFromMessages } from '../../utils/genAI';
import { v4 as uuidv4 } from 'uuid';

const getCarePlanController = async (req: Request, res: Response) => {
    const { care_plan_id } = req.params;
    const carePlan = await getCarePlan(care_plan_id as string);
    res.json(carePlan);
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

const createCarePlanFromMessagesController = async (req: Request, res: Response) => {
    const { messages, user_id, therapist_id, conversation_id } = req.body;
    const carePlan = await createCarePlanFromMessages(messages);
    const payload = new CarePlan({
        care_plan_id: uuidv4(),
        user_id: user_id as string,
        therapist_id: therapist_id as string,
        conversation_id: conversation_id as string,
        care_plan_description: carePlan,
        care_plan_created_at: new Date(),
        care_plan_updated_at: new Date(),
    });
    res.json(carePlan);
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
export { getCarePlanController, createCarePlanController, updateCarePlanController, deleteCarePlanController };