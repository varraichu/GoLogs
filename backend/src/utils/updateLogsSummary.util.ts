import mongoose from 'mongoose';
import LogSummary from '../models/LogsSummary';
import Log from '../models/Logs'; // You need to import your Log model
import { fetchAllAppsLogSummary } from '../services/logs.service';
import dotenv from 'dotenv';
import logger from '../config/logger';
import { buildLogSummaryAggregation } from '../aggregations/logs.aggregation';
dotenv.config();

/**
 * Generates and updates the log summary for the past 24 hours by aggregating logs
 * and replacing existing summary records in the database.
 */
export const updateLogSummary = async () => {
  try {
    // console.log('[LogSummary] Starting summary generation...');

    await mongoose.connect(process.env.MONGODB_URI!);

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Option 1: Use the aggregation pipeline directly
    const pipeline = buildLogSummaryAggregation(twentyFourHoursAgo, now);
    const summary = await Log.aggregate(pipeline);

    // Option 2: Use the service function (commented out)
    // const summary = await fetchAllAppsLogSummary(twentyFourHoursAgo, now);

    await LogSummary.deleteMany({});
    await LogSummary.insertMany(summary);

    logger.info('Logs Summary updated at', new Date());
  } catch (error) {
    logger.error('Error updating summary:', error);
  }
};
