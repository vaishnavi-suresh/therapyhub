import { getUser, createUser, updateUser, deleteUser, getAllUsers, getAllTherapists, getTherapistByEmail, getUserByExternalAuthId, getClientsByTherapistId, addClientToTherapist } from '../services/users';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User';

const createUserController = async (req: Request, res: Response) => {
    const { external_auth_id, email, first_name, last_name, role, therapist_id, client_ids } = req.body;
    const payload = new User({
        user_id: uuidv4(),
        external_auth_id: external_auth_id as string,
        email: email as string,
        first_name: first_name as string,
        last_name: last_name as string,
        created_at: new Date(),
        updated_at: new Date(),
        role: role as ['user', 'therapist', 'admin'],
        therapist_id: therapist_id as string | null,
        client_ids: client_ids as string[],
    });
    await createUser(payload);
    res.json(payload);
};

const updateUserController = async (req: Request, res: Response) => {
    const { user_id } = req.params;
    const { external_auth_id, email, first_name, last_name, role, therapist_id, client_ids } = req.body;
    const payload = new User({
        user_id: user_id as string,
        external_auth_id: external_auth_id as string,
        email: email as string,
        first_name: first_name as string,
        last_name: last_name as string,
        updated_at: new Date(),
        role: role as ['user', 'therapist', 'admin'],
        therapist_id: therapist_id as string | null,
        client_ids: client_ids as string[],
    });
    const user = await updateUser(user_id as string, payload);
    res.json(user);
};

const deleteUserController = async (req: Request, res: Response) => {
    const { user_id } = req.params;
    const user = await deleteUser(user_id as string);
    res.json(user);
};

const getUserController = async (req: Request, res: Response) => {
    const { user_id } = req.params;
    const user = await getUser(user_id as string);
    res.json(user);
};

const getAllUsersController = async (req: Request, res: Response) => {
    const users = await getAllUsers();
    res.json(users);
};

const getAllTherapistsController = async (req: Request, res: Response) => {
    const therapists = await getAllTherapists();
    res.json(therapists);
};

const getTherapistByEmailController = async (req: Request, res: Response) => {
    const { email } = req.params;
    const therapist = await getTherapistByEmail(email as string);
    res.json(therapist);
};

const getMeController = async (req: Request, res: Response) => {
    const sub = (req as any).user?.sub;
    if (!sub) return res.status(401).json({ message: 'Unauthorized' });
    const user = await getUserByExternalAuthId(sub);
    return res.json(user);
};

const getTherapistClientsController = async (req: Request, res: Response) => {
    const therapistId = (req as any).user?.userId;
    if (!therapistId) return res.status(401).json({ message: 'Unauthorized' });
    const { getTherabotConversationsByUserId } = await import('../services/therabot_conversations');
    const clients = await getClientsByTherapistId(therapistId);
    const withActivity = await Promise.all(clients.map(async (c: any) => {
        const convos = await getTherabotConversationsByUserId(c.user_id);
        const lastActivity = convos.length > 0
            ? new Date(Math.max(...convos.map((x: any) => new Date(x.conversation_updated_at || x.conversation_created_at).getTime())))
            : null;
        return { ...c, last_activity: lastActivity?.toISOString() ?? null };
    }));
    withActivity.sort((a: any, b: any) => {
        if (!a.last_activity) return 1;
        if (!b.last_activity) return -1;
        return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
    });
    res.json(withActivity);
};

const addClientToTherapistController = async (req: Request, res: Response) => {
    const { therapist_user_id, client_user_id } = req.body;
    if (!therapist_user_id || !client_user_id) {
        return res.status(400).json({ message: 'therapist_user_id and client_user_id are required' });
    }
    await addClientToTherapist(therapist_user_id, client_user_id);
    res.json({ success: true });
};

export { createUserController, updateUserController, deleteUserController, getUserController, getMeController, getAllUsersController, getAllTherapistsController, getTherapistByEmailController, getTherapistClientsController, addClientToTherapistController };