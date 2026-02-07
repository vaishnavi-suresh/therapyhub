import { Schema, model, Document } from 'mongoose';

interface CarePlan extends Document {
    care_plan_id: string;
    user_id: string;
    therapist_id: string;
    conversation_id?: string;
    care_plan_name?: string;
    care_plan_description: string;
    care_plan_created_at: Date;
    care_plan_updated_at: Date;
}

const carePlanSchema = new Schema({
    care_plan_id: { type: String, required: true },
    user_id: { type: String, required: true },
    therapist_id: { type: String, required: true },
    conversation_id: { type: String, required: false },
    care_plan_name: { type: String, required: false },
    care_plan_description: { type: String, required: true },
    care_plan_created_at: { type: Date, required: true },
    care_plan_updated_at: { type: Date, required: true },
});

const CarePlan = model<CarePlan>('CarePlan', carePlanSchema);

export { CarePlan };