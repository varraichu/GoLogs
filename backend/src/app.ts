import express from 'express';
import cors from 'cors';
import logger from './config/logger';
import authRoutes from './routes/auth.routes';
import userGroupRoutes from './routes/userGroups.routes';
import { errorHandler } from './middleware/error.middleware';
import applicationRoutes from './routes/application.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  logger.info('Incoming request');
  res.send('Hello World!');
});

app.use('/api/user-groups', userGroupRoutes);

app.use('/api/oauth', authRoutes);

app.use('/api/applications', applicationRoutes);

app.use(errorHandler);

export default app;
