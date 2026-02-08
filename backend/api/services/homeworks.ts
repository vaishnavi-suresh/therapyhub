import mongoClient from '../config/mongo';
import { Homework } from '../models/Homeworks';
import dotenv from 'dotenv';
dotenv.config();

const db = mongoClient.db(process.env.DB_NAME);
const homeworkCollection = db.collection<Homework>('homeworks');

const getHomework = async (user_id: string, therapist_id: string, homework_id: string) => {
    const homework = await homeworkCollection.findOne({user_id, therapist_id, homework_id});
    return homework;
};

const getAllHomeworks = async (user_id: string, therapist_id: string) => {
    const homeworks = await homeworkCollection.find({user_id, therapist_id}).toArray();
    return homeworks;
};

const createHomework = async (user_id: string, therapist_id: string, homework: Homework) => {
    const result = await homeworkCollection.insertOne(homework);
    return result.insertedId;
};

const updateHomework = async (user_id: string, therapist_id: string, homework_id: string, homework: Homework) => {
    const result = await homeworkCollection.updateOne({user_id, therapist_id, homework_id}, {$set: homework});
    return result.modifiedCount;
};

const deleteHomework = async (user_id: string, therapist_id: string, homework_id: string) => {
    const result = await homeworkCollection.deleteOne({user_id, therapist_id, homework_id});
    return result.deletedCount;
};

export { getHomework, getAllHomeworks, createHomework, updateHomework, deleteHomework };