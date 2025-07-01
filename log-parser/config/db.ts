import mongoose from 'mongoose';
import logger from './logger';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    logger.error('MONGODB_URI not set in environment variables');
    process.exit(1);
  }

  try {
    logger.info(`Connecting to MongoDB at ${uri}`);
    await mongoose.connect(uri);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('MongoDB connection failed', error);
    process.exit(1);
  }
};
