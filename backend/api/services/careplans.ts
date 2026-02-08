import mongoClient from '../config/mongo';
import { CarePlan } from '../models/CarePlan';
import dotenv from 'dotenv';
dotenv.config();

const db = mongoClient.db(process.env.DB_NAME);
const carePlanCollection = db.collection<CarePlan>('care_plans');

const getCarePlan = async (care_plan_id: string) => {
    const carePlan = await carePlanCollection.findOne({care_plan_id});
    return carePlan;
};

const getCarePlansByUserAndTherapist = async (user_id: string, therapist_id: string) => {
    return carePlanCollection.find({ user_id, therapist_id }).sort({ care_plan_created_at: -1 }).toArray();
};

const createCarePlan = async (carePlan: CarePlan) => {
    const result = await carePlanCollection.insertOne(carePlan);
    return result.insertedId;
};

const updateCarePlan = async (care_plan_id: string, carePlan: CarePlan) => {
    const result = await carePlanCollection.updateOne({care_plan_id}, {$set: carePlan});
    return result.modifiedCount;
};

const deleteCarePlan = async (care_plan_id: string) => {
    const result = await carePlanCollection.deleteOne({care_plan_id});
    return result.deletedCount;
};
export { getCarePlan, getCarePlansByUserAndTherapist, createCarePlan, updateCarePlan, deleteCarePlan };