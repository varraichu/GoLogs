import express from 'express';
import cors from 'cors';
import logger from './config/logger';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  logger.info('Incoming request');
  res.send('Hello World!');
});

app.use(errorHandler);

export default app;
