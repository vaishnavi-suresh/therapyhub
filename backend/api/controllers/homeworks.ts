import { Request, Response } from 'express';
import { getHomework, getAllHomeworks, createHomework, updateHomework, deleteHomework } from '../services/homeworks';
import { v4 as uuidv4 } from 'uuid';

const getHomeworkController = async (req: Request, res: Response) => {
    const { user_id, therapist_id, homework_id } = req.params;
    const homework = await getHomework(user_id, therapist_id, homework_id);
    res.json(homework);
};

const getAllHomeworksController = async (req: Request, res: Response) => {
    const { user_id, therapist_id } = req.params;
    const homeworks = await getAllHomeworks(user_id, therapist_id);
    res.json(homeworks);
};

const createHomeworkController = async (req: Request, res: Response) => {
    const { user_id, therapist_id } = req.params;
    const { homework } = req.body;
    const payload = {
        homework_id: uuidv4(),
        user_id: user_id as string,
        therapist_id: therapist_id as string,
        homework_title: homework.homework_title,
        homework_prompt: homework.homework_prompt,
        homework_response: null as string | null,
        homework_status: 'pending' as const,
        homework_created_at: new Date(),
        homework_updated_at: new Date(),
    };
    await createHomework(user_id, therapist_id, payload as any);
    res.json(payload);
};

const updateHomeworkController = async (req: Request, res: Response) => {
    const { user_id, therapist_id, homework_id } = req.params;
    const { homework_title, homework_prompt, homework_response, homework_status } = req.body;
    const payload = {
        homework_id: homework_id as string,
        user_id: user_id as string,
        therapist_id: therapist_id as string,
        homework_title: homework_title as string,
        homework_prompt: homework_prompt as string,
        homework_response: homework_response as string | null,
        homework_status: homework_status as 'pending' | 'completed' | 'archived',
        homework_created_at: new Date(),
        homework_updated_at: new Date(),
    };
    await updateHomework(user_id, therapist_id, homework_id, payload as any);
    const updated = await getHomework(user_id, therapist_id, homework_id);
    res.json(updated);
};

const deleteHomeworkController = async (req: Request, res: Response) => {
    const { user_id, therapist_id, homework_id } = req.params;
    const result = await deleteHomework(user_id, therapist_id, homework_id);
    res.json(result);
};

export { getHomeworkController, getAllHomeworksController, createHomeworkController, updateHomeworkController, deleteHomeworkController };