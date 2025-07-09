import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import logger from './config/logger';
import authRoutes from './routes/auth.routes';
import userGroupRoutes from './routes/userGroups.routes';
import directoryRoutes from './routes/directory.routes';
import applicationRoutes from './routes/applications.routes';
import logRoutes from './routes/logs.routes';
import settingsRoutes from './routes/settings.routes';
import { errorHandler } from './middleware/error.middleware';
import assignGroupRoutes from './routes/assignGroup.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  logger.info('Incoming request');
  res.send('Hello World!');
});

app.use('/api/user-groups', userGroupRoutes);

app.use('/api/assignGroup', assignGroupRoutes);
app.use('/api/oauth', authRoutes);

app.use('/api/userGroup', userGroupRoutes);
app.use('/api/directory', directoryRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/settings', settingsRoutes);

app.use(errorHandler);

export default app;
