import { Queue } from "bullmq";
import IORedis from "ioredis";
import { createHash } from "crypto";

const redisConnection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379,
    maxRetriesPerRequest: null, // Disable automatic retries
    password: "redis1234PASS", // Replace with your actual Redis password
});

const redisKey = process.env.REDIS_KEY || 'logs';
const bullQueueName = process.env.BULL_QUEUE_NAME || 'logQueue';
const batchSize = 100;
const pollInterval = 5000;

//Initialize the BullMQ queue
const logQueue = new Queue(bullQueueName, { connection: redisConnection });

/**
 * Generates a deterministic SHA256 hash from a string.
 * @param content The string content of the log.
 * @returns A unique SHA256 hash.
 */
const generateIdempotencyKey = (content: string): string => {
    return createHash('sha256').update(content).digest('hex');
};

/**
 * Helper function to safely get error message from unknown error type
 */
const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};

/**
 * Fetches logs from Redis in batches, transforms them into BullMQ jobs, and adds them to the queue.
 */
const processBatch = async () => {
    try {
        //fetch batch of logs from redis
        const logs = await redisConnection.lrange(redisKey, 0, batchSize - 1);
        if (logs.length === 0) {
            console.log('No logs to process. Waiting for new logs...');
            return; // No logs to process, exit the function
        }
        console.log(`Processing batch of ${logs.length} logs...`);

        // Transform logs into BullMQ jobs
        const jobs = logs.map(log => {
            let logData: any;
            try {
                logData = JSON.parse(log);
            }
            catch (error) {
                logData = { message: log };
                console.warn('Log content is not valid JSON, using raw content:', log);
            }
            return {
                name: 'process-log',
                data: logData,
                opts: {
                    jobId: generateIdempotencyKey(log), // Use a unique ID for idempotency
                    removeOnComplete: 100, // Remove job from queue after completion
                    removeOnFail: 50,
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    }
                },
            };
        });

        try {
            //add jobs to the BullMQ queue
            const addedJobs = await logQueue.addBulk(jobs);
            console.log(`Added ${addedJobs.length} jobs to the queue.`);
    
            //remove processed logs from Redis
            const removedCount = await redisConnection.ltrim(redisKey, logs.length, -1);
            console.log(`Removed logs from Redis. ${removedCount}`);
        }
        catch (bullError: unknown) {  // Explicitly type as unknown
            const errorMessage = getErrorMessage(bullError);
            console.error('Failed to add jobs to BullMQ queue:', errorMessage);
            
            // Check if it's a duplicate job error (idempotency working)
            if (errorMessage.includes('duplicate')) {
                console.log('Some jobs were duplicates (idempotency working), removing from Redis anyway');
                await redisConnection.ltrim(redisKey, logs.length, -1);
            } else {
                // For other errors, don't remove logs so they can be retried
                console.log('Keeping logs in Redis for retry on next iteration');
                throw bullError; // Re-throw to be caught by outer try-catch
            }
        }
    }
    catch (error: unknown) {  // Explicitly type as unknown
        const errorMessage = getErrorMessage(error);
        console.error('Error processing batch:', errorMessage);
        
        // Add exponential backoff for failed batches
        const backoffDelay = Math.min(pollInterval * 2, 30000); // Max 30 seconds
        console.log(`Waiting ${backoffDelay / 1000} seconds before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay - pollInterval));
    }
};

// Main function to start processing logs
const startBridge = async () => {
    console.log('Starting log bridge...');
    console.log(`Connecting to Redis at ${redisConnection.options.host}:${redisConnection.options.port}...`);
    console.log(`Using Redis key: ${redisKey}`);
    console.log(`Using BullMQ queue: ${bullQueueName}`);
    console.log(`Batch size: ${batchSize}. Interval: ${pollInterval / 1000} seconds.`);
    
    // Set an interval to poll for new logs every 5 seconds
    setInterval(async () => {
        try {
            await processBatch();
        } catch (error: unknown) {  // Explicitly type as unknown
            const errorMessage = getErrorMessage(error);
            console.error('Error in processing batch:', errorMessage);
        }
    }, pollInterval);

    console.log(`Log bridge is running. Polling every ${pollInterval / 1000} seconds...`);
}

startBridge().catch((error: unknown) => {  // Explicitly type as unknown
    const errorMessage = getErrorMessage(error);
    console.error('Failed to start log bridge:', errorMessage);
    process.exit(1);
});