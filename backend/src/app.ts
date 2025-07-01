import express from 'express';
import {Request, Response} from "express";
import cors from 'cors';
import logger from './config/logger';
import authRoutes from './routes/auth.routes';
import userGroupRoutes from './routes/userGroups.routes';
import { errorHandler } from './middleware/error.middleware';
import appGroupRoutes from "./routes/appGroupRoutes"

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req:Request, res:Response) => {
  logger.info('Incoming request');
  res.send('Hello World!');
});

app.use('/api/apps', appGroupRoutes)
app.use('/api/oauth', authRoutes);

app.use('/api/userGroup', userGroupRoutes);

app.use(errorHandler);

export default app;
