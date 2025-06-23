// Save this file as worker.js
// This script processes jobs from the BullMQ queue and writes the output to a file.

const { Worker } = require('bullmq');
const fs = require('fs').promises; // Import the built-in Node.js File System module
const path = require('path'); // Import path module for handling file paths

// --- Configuration ---
// Make sure these settings match your environment.

// The name of the queue. This MUST match the queue name in your bridge.js file.
const QUEUE_NAME = 'log-processing';

// The path for the output file where processed logs will be stored.
const OUTPUT_LOG_FILE = path.join(__dirname, 'logs', 'processed_logs.log');


// Connection details for your Redis server.
const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'redis',
  port: 6379,
  password: 'foobared',
};

// --- BullMQ Worker Implementation ---
console.log(`🚀 Starting worker for BullMQ queue: "${QUEUE_NAME}"`);
console.log(`📝 Processed logs will be written to: ${OUTPUT_LOG_FILE}`);

const worker = new Worker(QUEUE_NAME, async job => {
  try {
    const logData = job.data;

    console.log(`✅ Worker: Processing Job #${job.id}`);
    console.log('Log Received:', logData);

    // --- NEW: Write to Output File ---
    // Create a structured log entry to save to the file.
    const logEntry = {
      processedAt: new Date().toISOString(),
      jobId: job.id,
      data: logData,
    };

    // Convert the log entry object to a JSON string and add a newline.
    const fileContent = JSON.stringify(logEntry) + '\n';

    // Asynchronously append the content to the output file.
    await fs.appendFile(OUTPUT_LOG_FILE, fileContent);

    // --- YOUR CUSTOM LOGIC GOES HERE ---
    if (logData.message && logData.message.toLowerCase().includes('error')) {
      console.warn(`🚨 Worker: Found an error log! Triggering an alert...`);
    }

    return { status: 'Completed', writtenToFile: true };
  } catch (error) {
    console.error(`❌ Worker Error: processing Job #${job.id}:`, error);
    // If an error occurs, the job will fail and not be written to the log file.
    throw error;
  }
}, { connection: REDIS_CONNECTION });


// --- Worker Event Listeners ---
worker.on('completed', (job, result) => {
  console.log(`🎉 Worker: Job #${job.id} completed successfully.`);
});

worker.on('failed', (job, err) => {
  console.error(`🔥 Worker: Job #${job.id} failed with error: ${err.message}`);
});

console.log('Worker is listening for jobs...');
