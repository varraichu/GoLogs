import express from 'express';
import cors from 'cors';
import requestLogger from './middleware/logging.middleware';
import traceMiddleware from './middleware/traceId.middleware';
import authRoutes from './routes/auth.routes';
import userGroupRoutes from './routes/userGroups.routes';
import directoryRoutes from './routes/directory.routes';
import applicationRoutes from './routes/applications.routes';
import logRoutes from './routes/logs.routes';
import settingsRoutes from './routes/settings.routes';
import { errorHandler } from './middleware/error.middleware';
import assignGroupRoutes from './routes/assignGroup.routes';
import appsHealthRoutes from './routes/appsHealth.routes';
import chatRoutes from './routes/chat.routes';
import cookieParser from 'cookie-parser';
import config from 'config';

const app = express();

app.use(
  cors({
    origin: config.get('FRONTEND_URL'),
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use(traceMiddleware);
app.use(requestLogger);

app.use('/api/assignGroup', assignGroupRoutes);
app.use('/api/oauth', authRoutes);

app.use('/api/userGroup', userGroupRoutes);
app.use('/api/directory', directoryRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/appsHealth', appsHealthRoutes);
app.use('/api/chat', chatRoutes);

app.use(errorHandler);

export default app;
