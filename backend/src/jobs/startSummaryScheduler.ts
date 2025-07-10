import cron from 'node-cron';
import { updateLogSummary } from '../scripts/updateLogsSummary';

console.log('[Cron] Starting log summary scheduler...');

cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Running hourly log summary update...');
  try {
    await updateLogSummary();
    console.log('[Cron] Summary update completed');
  } catch (err) {
    console.error('[Cron] Error running summary update:', err);
  }
});
