import dotenv from 'dotenv';
dotenv.config();

import { Worker, Job } from "bullmq";
import IORedis, { Redis } from "ioredis";
import { connectDB } from './config/db';
import logger from './config/logger';

import { insertLogs } from './controllers/logs.controllers';
import { insertLogToDBSchema } from './schemas/logs.validator';
import { getApplicationIdByName } from './controllers/applications.controllers';

const redisConnection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379,
    maxRetriesPerRequest: null, // Disable automatic retries
    password: "redis1234PASS", // Replace with your actual Redis password

});


const bullQueueName = process.env.BULL_QUEUE_NAME || 'logQueue';
const concurrency = 500;

//key for the redis set to track processed job IDs
const processedJobSetKey = `${bullQueueName}_processed_jobs`;

console.log(`Starting worker for queue "${bullQueueName}"...`);

const redisClient: Redis = redisConnection;

/**
 * Worker function to process jobs from the BullMQ queue.
 * @param job The job to process.
 */

const processJobs = async (job: Job) => {
    //Check if job is already processed
    if (!job.id) {
        console.warn("Job has no ID, skipping.");
        return;
    }

    const isProcessed = await redisClient.sadd(processedJobSetKey, job.id);

    if (isProcessed === 0) {
        console.warn(`Skip Job ${job.id}. ALready processed.`);
        return;
    }

    try {
        const appObjectId = await getApplicationIdByName(job.data.app_name);
        const app_id = appObjectId.toString();
        //Format job data
        const enrichedData = {
            ...job.data,
            app_id,
            ingested_at: new Date().toISOString(),
        };

        // console.error(`Processing Job ${job.id} with data:`, enrichedData);
        const parsed = insertLogToDBSchema.shape.body.safeParse(enrichedData);

        if (!parsed.success) {
            console.error(`Validation failed for Job ${job.id}:`, parsed.error.errors);
            // Optionally, remove from processed set so it can be retried/fixed
            await redisClient.srem(processedJobSetKey, job.id);
            throw new Error(`Validation failed: ${JSON.stringify(parsed.error.errors)}`);
        }

        // Save to MongoDB
        await insertLogs(parsed.data);

        await redisClient.sadd(processedJobSetKey, job.id);

        // console.log(`Processed Job ${job.id} successfully.`);

    }
    catch (error) {
        console.error(`Error processing Job ${job.id}:`, error);
        // Optionally, you can remove the job from the processed set if it fails
        await redisClient.srem(processedJobSetKey, job.id);
        throw error; // Re-throw the error to let BullMQ handle it
    }
};

//Worker setup to process jobs from the queue
const startWorker = async () => {
    try {
        await connectDB();

        const worker = new Worker(bullQueueName, processJobs, {
            connection: redisConnection,
            concurrency: concurrency,
            removeOnComplete: { count: 1000 },
            removeOnFail: { count: 5000 },
        });

        worker.on('completed', (job) => {
            console.log(`Job ${job.id} completed`);
        });

        worker.on('failed', (job, err) => {
            console.error(`Job ${job?.id} failed: ${err.message}`);
        });

        worker.on('error', (err) => {
            console.error('Worker error:', err);
        });

        console.log(`Worker started with concurrency ${concurrency}.`);
    } catch (error) {
        logger.error("Worker startup failed:", error);
        process.exit(1);
    }
};

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${(err as Error).message}`);
    process.exit(1);
});

startWorker();