import mongoose from 'mongoose';
import logger from './logger';
import config from 'config';

/**
 * Connects to MongoDB using config URI.
 * Logs success or exits on failure.
 */
export const connectDB = async () => {
  try {
    await mongoose.connect(config.get('mongodb.uri') as string);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('MongoDB connection failed', error);
    process.exit(1);
  }
};
