import express from 'express';
import carePlanRouter from './routes/carePlan';
import conversationRouter from './routes/conversations';
import messageRouter from './routes/message';
import userRouter from './routes/users';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
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
app.use(carePlanRouter);
app.use(conversationRouter);
app.use(messageRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
