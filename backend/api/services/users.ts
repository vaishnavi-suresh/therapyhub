import mongoClient from '../config/mongo';
import { User } from '../models/User';
import dotenv from 'dotenv';
dotenv.config();

const db = mongoClient.db(process.env.DB_NAME);
const userCollection = db.collection<User>('users');

const getUser = async (user_id: string) => {
    const user = await userCollection.findOne({user_id});
    return user;
};

const getAllUsers = async () => {
    const users = await userCollection.find({}).toArray();
    return users;
};

const getAllTherapists = async () => {
    const therapists = await userCollection.find({role: 'therapist'}).toArray();
    return therapists;
};

const getTherapistByEmail = async (email: string) => {
    const therapist = await userCollection.findOne({email, role: 'therapist'});
    return therapist;
};

const getUserByExternalAuthId = async (external_auth_id: string) => {
    return userCollection.findOne({ external_auth_id });
};

const createUser = async (user: User) => {
    const result = await userCollection.insertOne(user);
    return result.insertedId;
};

const updateUser = async (user_id: string, user: User) => {
    const result = await userCollection.updateOne({user_id}, {$set: user});
    return result.modifiedCount;
};

const deleteUser = async (user_id: string) => {
    const result = await userCollection.deleteOne({user_id});
    return result.deletedCount;
};

const getClientsByTherapistId = async (therapist_user_id: string) => {
    return userCollection.find({ therapist_id: therapist_user_id }).toArray();
};

const addClientToTherapist = async (therapist_user_id: string, client_user_id: string) => {
    const therapist = await userCollection.updateOne(
        { user_id: therapist_user_id },
        { $addToSet: { client_ids: client_user_id } }
    );
    const client = await userCollection.updateOne(
        { user_id: client_user_id },
        { $set: { therapist_id: therapist_user_id as string } }
    );
    return { therapist, client };
};

export { getUser, createUser, updateUser, deleteUser, getAllUsers, getAllTherapists, getTherapistByEmail, getUserByExternalAuthId, getClientsByTherapistId, addClientToTherapist };