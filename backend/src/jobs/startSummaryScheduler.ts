import cron from 'node-cron';
import { updateLogSummary } from '../utils/updateLogsSummary.util';
import logger from '../config/logger';

logger.debug('Starting log summary scheduler...');
// Runs every 15 minutes (e.g. 00, 15, 30, 45 of each hour)
cron.schedule('*/15 * * * *', async () => {
  logger.debug('Running log summary update every 15 mins...');
  try {
    await updateLogSummary();
    logger.info('Summary update completed');
  } catch (err) {
    logger.error('Error running summary update:', err);
  }
});
