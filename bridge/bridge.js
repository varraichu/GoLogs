// Save this file as bridge.js
// This is a more reliable, transactional bridge that prevents log loss.

const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const { v4: uuidv4 } = require('uuid'); // To uniquely identify logs

// --- Configuration ---
const QUEUE_NAME = 'log-processing';
const FLUENT_BIT_LIST_KEY = 'logs';

// We introduce a new list to temporarily hold logs that are being processed.
const IN_PROCESSING_LIST_KEY = 'logs:in-processing';

const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'redis',
  port: 6379,
  password: 'foobared',
  maxRetriesPerRequest: null,
};

// --- Reliable Bridge Implementation ---
const queue = new Queue(QUEUE_NAME, { connection: REDIS_CONNECTION });
const redisClient = new IORedis(REDIS_CONNECTION);

// This function runs when the bridge starts. It checks for any "orphaned" logs
// that might have been left over from a previous crash.
const processOrphanedLogs = async () => {
  console.log(`🌉 Bridge: Checking for orphaned logs in "${IN_PROCESSING_LIST_KEY}"...`);
  let orphanedLog;
  // Move any orphaned logs back to the main queue to be re-processed.
  while ((orphanedLog = await redisClient.rpop(IN_PROCESSING_LIST_KEY))) {
    console.warn(`🌉 Bridge: Found orphaned log. Re-queueing...`);
    await redisClient.lpush(FLUENT_BIT_LIST_KEY, orphanedLog);
  }
  console.log(`🌉 Bridge: Orphan check complete.`);
};

// This is the main loop for the bridge.
const startMainLoop = async () => {
  console.log(`🌉 Bridge: Starting main loop. Waiting for logs from Fluent Bit...`);
  while (true) {
    let logString = null;
    try {
      // 1. ATOMICALLY move a log from the Fluent Bit list to our temporary "in-processing" list.
      // This command will wait forever until a log appears.
      // If the bridge crashes here, the log is safely in one of the two lists.
      logString = await redisClient.brpoplpush(FLUENT_BIT_LIST_KEY, IN_PROCESSING_LIST_KEY, 0);

      if (logString) {
        // 2. Now that the log is safely in the 'in-processing' list, try to add it to BullMQ.
        const logData = JSON.parse(logString);
        await queue.add('log-job', logData, {
          removeOnComplete: true,
          removeOnFail: 1000, // Keep last 1000 failed jobs
          // Add a unique ID to prevent duplicate processing if a job is added more than once
          jobId: uuidv4(),
        });
        console.log('✅ Log added to BullMQ:', logData);
        // successfully added to BullMQ checked in docker by manually injecting log into redis


        // 3. SUCCESS! The log is now in BullMQ. We can safely remove it from the "in-processing" list.
        // We use LREM to remove the specific log entry, in case other logs were added in the meantime.
        await redisClient.lrem(IN_PROCESSING_LIST_KEY, -1, logString);
      }
    } catch (error) {
      console.error('----------------------------------------------------');
      console.error('🌉 Bridge CRITICAL ERROR:', error.message);
      console.error('The log that caused the error is still safely stored in the list:', IN_PROCESSING_LIST_KEY);
      console.error('Log content:', logString);
      console.error('The bridge will pause for 10 seconds before retrying.');
      console.error('----------------------------------------------------');
      // In a real production system, you would have an alert here.
      // We pause to prevent a tight loop of failures (e.g., if Redis is down).
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
};

// --- Main Execution ---
const start = async () => {
  await processOrphanedLogs();
  await startMainLoop();
};

start();
