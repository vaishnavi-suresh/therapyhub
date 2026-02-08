import express from 'express';
import carePlanRouter from './routes/carePlan';
import therabotConversationsRouter from './routes/therabot_conversations';
import therabotMessagesRouter from './routes/therabot_messages';
import userRouter from './routes/users';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { homeworksRouter } from './routes/homeworks';
import { meetingRecordingsRouter } from './routes/meeting_recording';
import videoSDKRouter from './routes/videoSDK';
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(cors({
    origin: [process.env.FRONTEND_URL as string || 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
}));
app.use(helmet());
app.use(userRouter);
app.use('/care_plans', carePlanRouter);
app.use('/therabot_conversations', therabotConversationsRouter);
app.use(therabotMessagesRouter);
app.use('/homeworks', homeworksRouter);
app.use('/meeting_recordings', meetingRecordingsRouter);
app.use('/videosdk', videoSDKRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
