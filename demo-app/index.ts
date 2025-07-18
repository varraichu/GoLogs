import * as fs from 'fs';
import * as path from 'path';
import { Writable } from 'stream';
import { Pool } from 'pg';

// Define the new structure of a log entry for type safety
interface LogEntry {
  message: string;
  timestamp: string;
  log_type: 'info' | 'warn' | 'error' | 'debug';
}

// --- Configuration ---
const LOG_FILE_PATH: string = path.join(__dirname, 'logs', 'app.log');
const LOGS_PER_SECOND = Number(process.env.LOG_COUNT) || 10;
const TOTAL_DURATION_SECONDS: number = 1;
const LOG_TYPES: LogEntry['log_type'][] = ['info', 'warn', 'error', 'debug'];

// --- Database Connection ---
const db = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  user: process.env.POSTGRES_USER || 'myuser',
  password: process.env.POSTGRES_PASSWORD || 'mypassword',
  database: process.env.POSTGRES_DB || 'mydb',
  port: 5432,
});
db.query('SELECT 1').then(() => console.error('DB connected')).catch(console.error);



/**
 * Generates a single log line as a JSON string with a random log type.
 * @param index - The index number for the log entry to make it unique.
 * @returns A JSON string representing the log entry, followed by a newline.
 */
function generateLogLine(index: number): string {
  const goodMessages = [
    `Synthetic log entry #${index}: User successfully logged in using OAuth2 provider.`,
    `Synthetic log entry #${index}: Background sync completed. 253 records updated.`,
    `Synthetic log entry #${index}: Health check passed. All dependent services responded within threshold.`,
    `Synthetic log entry #${index}: Scheduled job 'cleanupOldSessions' executed in 1.24s.`,
    `Synthetic log entry #${index}: Configuration loaded successfully from environment variables.`,
    `Synthetic log entry #${index}: Uploaded file processed and stored at /uploads/reports/2025-07/report.csv.`,
    `Synthetic log entry #${index}: API key rotation completed successfully for client_id abc123.`,
  ];

  const badMessages = [
    `Synthetic log entry #${index}: Failed to connect to MongoDB after 3 attempts. Retrying in 5 seconds.`,
    `Synthetic log entry #${index}: Memory usage exceeded 85%. Potential leak in worker process.`,
    `Synthetic log entry #${index}: Unhandled exception in payment processor: TypeError: amount.toFixed is not a function.`,
    `Synthetic log entry #${index}: Slow query detected on collection 'logs' (execution time: 4200ms).`,
    `Synthetic log entry #${index}: Authentication failed for user 'admin@example.com'. Invalid credentials.`,
    `Synthetic log entry #${index}: File upload rejected due to unsupported MIME type: application/x-msdownload.`,
    `Synthetic log entry #${index}: Timeout while waiting for response from external API: https://payments.example.com/charge.`,
  ];

  const isGood = Math.random() < 0.5;

  const message = isGood
    ? goodMessages[Math.floor(Math.random() * goodMessages.length)]
    : badMessages[Math.floor(Math.random() * badMessages.length)];

  const goodTypes = LOG_TYPES.filter((type) => type === 'info' || type === 'debug');
  const badTypes = LOG_TYPES.filter((type) => type === 'warn' || type === 'error');

  const log_type = isGood
    ? goodTypes[Math.floor(Math.random() * goodTypes.length)]
    : badTypes[Math.floor(Math.random() * badTypes.length)];

  const log: LogEntry = {
    message,
    timestamp: new Date().toISOString(),
    log_type,
  };

  return JSON.stringify(log) + '\n';
}

// Insert log into DB
async function insertLogToDB(log: LogEntry) {
  // console.error('Attempting to insert log:', log);
  try {
    await db.query(
      'INSERT INTO logs (message, timestamp, log_type) VALUES ($1, $2, $3)',
      [log.message, log.timestamp, log.log_type]
    );
    // console.error('Log inserted successfully');
  } catch (err) {
    console.error('Failed to insert log to DB:', err);
  }
}


/**
 * Writes a single log entry to all provided writable streams.
 * This is our new centralized logging function.
 * @param logLine - The complete log string to write.
 * @param streams - An array of Writable streams (e.g., file stream, process.stdout).
 */
async function writeLogEntry(logLine: string, streams: Writable[]): Promise<void> {
  for (const stream of streams) {
    stream.write(logLine);
  }
  try {
    const log: LogEntry = JSON.parse(logLine);
    await insertLogToDB(log);
  } catch (err) {
    console.error('Failed to insert log to DB:', err);
  }
}

/**
 * Generates and writes a batch of log lines to the designated streams.
 * @param streams - The array of streams to write to.
 * @param indexStart - The starting index for the log entries in this batch.
 */
async function writeLogBatch(streams: Writable[], indexStart: number, isFileStream: boolean = false): Promise<void> {
  for (let i = 0; i < LOGS_PER_SECOND; i++) {
    const offset = isFileStream ? 10 : 0;
    const logLine = generateLogLine(indexStart + i + offset);
    await writeLogEntry(logLine, streams);
  }
}

/**
 * Main function to start the log generation process.
 * It creates a directory and file if they don't exist,
 * then writes logs periodically to all streams.
 */
async function startLogGeneration(): Promise<void> {
  const statusLogger = console; // Use console for status messages, separate from log data

  try {
    // Ensure the 'logs' directory exists
    const logDir = path.dirname(LOG_FILE_PATH);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
      statusLogger.error(`Created log directory at: ${logDir}`);
    }

    // Create a writable stream to the log file in append mode
    const fileStream = fs.createWriteStream(LOG_FILE_PATH, { flags: 'a' });

    // Define all our log destinations
    const logStreams: Writable[] = [fileStream, process.stdout];
    // const logStreams: Writable[] = [fileStream];
    // const logStreams: Writable[] = [process.stdout];

    let count: number = 0;

    statusLogger.error(`🚀 Writing ${LOGS_PER_SECOND} logs/sec to ${LOG_FILE_PATH} AND stdout for ${TOTAL_DURATION_SECONDS} seconds...`);

    // Start writing logs every second
    for (let sec = 0; sec < TOTAL_DURATION_SECONDS; sec++) {
      await writeLogBatch(logStreams, count);
      count += LOGS_PER_SECOND;
      statusLogger.error(`Wrote batch #${sec + 1}`);
      await new Promise(res => setTimeout(res, 1000));
    }

    fileStream.end(() => statusLogger.error('✅ Finished writing logs. File stream closed.'));
    await db.end();


  } catch (error) {
    statusLogger.error('An error occurred during log generation:', error);
  }
}

// Execute the main function
startLogGeneration();