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

    // const logCount = await Logs.countDocuments({
    //   timestamp: { $gte: twentyFourHoursAgo, $lte: now },
    // });
    // console.log('Log count in last 24h:', logCount);
    // Fetch summary for all apps regardless of user access
    const summary = await fetchAllAppsLogSummary({
      startDate: twentyFourHoursAgo,
      endDate: now,
    });

    // console.log('[LogSummary] Summary length:', summary.length);
    // console.log('[LogSummary] Sample data:', JSON.stringify(summary[0], null, 2));

    // Overwrite existing collection
    await LogSummary.deleteMany({});
    await LogSummary.insertMany(summary);

    logger.info('[LogSummary] Summary updated at', new Date());
  } catch (error) {
    logger.error('[LogSummary] Error updating summary:', error);
  }
};
