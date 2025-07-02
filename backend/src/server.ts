import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import logger from './config/logger';
import config from 'config';
import { connectDB } from './config/db';

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

const startServer = async () => {
  try {
    await connectDB();
    const PORT = config.get('app.port');
    app.listen(PORT, () => logger.debug(`Server running on port ${PORT}`));
  } catch (error) {
    logger.error('Server startup failed', error);
    process.exit(1);
  }
  // connectDB();
};

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${(err as Error).message}`);
  process.exit(1);
});

startServer();
