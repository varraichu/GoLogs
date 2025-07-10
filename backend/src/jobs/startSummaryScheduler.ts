import cron from 'node-cron';
import { updateLogSummary } from '../scripts/updateLogsSummary';

console.log('[Cron] Starting log summary scheduler...');
// Runs every 15 minutes (e.g. 00, 15, 30, 45 of each hour)
cron.schedule('*/15 * * * *', async () => {
  console.log('[Cron] Running log summary update every 15 mins...');
  try {
    await updateLogSummary();
    console.log('[Cron] Summary update completed');
  } catch (err) {
    console.error('[Cron] Error running summary update:', err);
  }
});
