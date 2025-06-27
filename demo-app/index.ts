import * as fs from 'fs';
import * as path from 'path';
import { Writable } from 'stream';
import { Pool } from 'pg';

// Define the new structure of a log entry for type safety
interface LogEntry {
  app_id: string;
  message: string;
  timestamp: string;
  log_type: 'info' | 'warn' | 'error' | 'debug';
}

// --- Configuration ---
const LOG_FILE_PATH: string = path.join(__dirname, 'logs', 'app.log');
const LOGS_PER_SECOND: number = 1;
const TOTAL_DURATION_SECONDS: number = 10;
const APP_ID: string = 'demo-app'; // Example App ID
const LOG_TYPES: LogEntry['log_type'][] = ['info', 'warn', 'error', 'debug'];

// --- Database Connection ---
const db = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  user: process.env.POSTGRES_USER || 'myuser',
  password: process.env.POSTGRES_PASSWORD || 'mypassword',
  database: process.env.POSTGRES_DB || 'mydb',
  port: 5432,
});
db.query('SELECT 1').then(() => console.log('DB connected')).catch(console.error);

/**
 * Generates a single log line as a JSON string with a random log type.
 * @param index - The index number for the log entry to make it unique.
 * @returns A JSON string representing the log entry, followed by a newline.
 */
function generateLogLine(index: number): string {
  const randomLogType = LOG_TYPES[Math.floor(Math.random() * LOG_TYPES.length)];

  const log: LogEntry = {
    app_id: APP_ID,
    message: `Synthetic log entry #${index}`,
    timestamp: new Date().toISOString(),
    log_type: randomLogType,
  };
  return JSON.stringify(log) + '\n';
}

// Insert log into DB
async function insertLogToDB(log: LogEntry) {
  console.log('Attempting to insert log:', log);
  try {
    await db.query(
      'INSERT INTO logs (app_id, message, timestamp, log_type) VALUES ($1, $2, $3, $4)',
      [log.app_id, log.message, log.timestamp, log.log_type]
    );
    console.log('Log inserted successfully');
  } catch (err) {
    console.error('❌ Failed to insert log to DB:', err);
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
    console.error('❌ Failed to insert log to DB:', err);
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
      statusLogger.error(`📂 Created log directory at: ${logDir}`);
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
    const intervalId = setInterval(async () => {
      await writeLogBatch(logStreams, count);
      count += LOGS_PER_SECOND;
      statusLogger.error(`✅ Wrote batch #${(count / LOGS_PER_SECOND)}`);

      // Clear logs table every 5 minutes
      // setInterval(async () => {
      //   try {
      //     await db.query("DELETE FROM logs WHERE timestamp < NOW() - INTERVAL '5 minutes'");
      //     statusLogger.error('🧹 Old logs cleared from the table!');
      //   } catch (err) {
      //     statusLogger.error('❌ Failed to clear old logs from table:', err);
      //   }
      // }, 5 * 60 * 1000);

      if (count >= TOTAL_DURATION_SECONDS * LOGS_PER_SECOND) {
        clearInterval(intervalId);
        fileStream.end(() => statusLogger.error('✅ Finished writing logs. File stream closed.'));
        await db.end();
      }
    }, 1000);


  } catch (error) {
    statusLogger.error('❌ An error occurred during log generation:', error);
  }
}

// Execute the main function
startLogGeneration();