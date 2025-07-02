import express from 'express';
import cors from 'cors';
import logger from './config/logger';
import authRoutes from './routes/auth.routes';
import userGroupRoutes from './routes/userGroups.routes';
import directoryRoutes from './routes/directory.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  logger.info('Incoming request');
  res.send('Hello World!');
});

app.use('/api/oauth', authRoutes);

app.use('/api/userGroup', userGroupRoutes);
app.use('/api/directory', directoryRoutes);

app.use(errorHandler);

export default app;
