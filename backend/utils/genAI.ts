import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

import { treatmentPlanPrompt, therapeuticBotSystemPrompt } from './prompts';
dotenv.config();

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.VERTEX_AI_LOCATION ?? 'us-central1',
  apiVersion: 'v1',
});

const createCarePlan = async (messages: string[]): Promise<string> => {
  const prompt = treatmentPlanPrompt(messages.join('\n'));
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  return response.text ?? '';
};

const createTherapistBotResponse = async (messages: string[]): Promise<string> => {
  const prompt = therapeuticBotSystemPrompt;
  const addOnMessages = 'This is the conversation history: ' + messages.join('\n');
  const contents = prompt + addOnMessages;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
  });
  return response.text ?? '';
};

export { createCarePlan, createTherapistBotResponse };
