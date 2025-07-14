import mongoose from 'mongoose';
import LogSummary from '../models/LogsSummary';
import { fetchAllAppsLogSummary } from '../services/logs.service';
import dotenv from 'dotenv';
import logger from '../config/logger';
dotenv.config();

export const updateLogSummary = async () => {
  try {
    console.log('[LogSummary] Starting summary generation...');

    await mongoose.connect(process.env.MONGODB_URI!);

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const summary = await fetchAllAppsLogSummary({
      startDate: twentyFourHoursAgo,
      endDate: now,
    });

    await LogSummary.deleteMany({});
    await LogSummary.insertMany(summary);

    logger.info('[LogSummary] Summary updated at', new Date());
  } catch (error) {
    logger.error('[LogSummary] Error updating summary:', error);
  }
};
