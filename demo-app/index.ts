import * as fs from 'fs';
import * as path from 'path';
import { Writable } from 'stream';

// Define the new structure of a log entry for type safety
interface LogEntry {
  app_id: string;
  message: string;
  timestamp: string;
  log_type: 'info' | 'warn' | 'error' | 'debug';
}

// --- Configuration ---
const LOG_FILE_PATH: string = path.join(__dirname, 'logs', 'app.log');
const LOGS_PER_SECOND: number = 10;
const TOTAL_DURATION_SECONDS: number = 360;
const APP_ID: string = 'demo-app'; // Example App ID
const LOG_TYPES: LogEntry['log_type'][] = ['info', 'warn', 'error', 'debug'];

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

/**
 * Writes a single log entry to all provided writable streams.
 * This is our new centralized logging function.
 * @param logLine - The complete log string to write.
 * @param streams - An array of Writable streams (e.g., file stream, process.stdout).
 */
function writeLogEntry(logLine: string, streams: Writable[]): void {
  for (const stream of streams) {
    stream.write(logLine);
  }
}

/**
 * Generates and writes a batch of log lines to the designated streams.
 * @param streams - The array of streams to write to.
 * @param indexStart - The starting index for the log entries in this batch.
 */
function writeLogBatch(streams: Writable[], indexStart: number): void {
  for (let i = 0; i < LOGS_PER_SECOND; i++) {
    const logLine = generateLogLine(indexStart + i);
    writeLogEntry(logLine, streams);
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
      statusLogger.log(`📂 Created log directory at: ${logDir}`);
    }
    
    // Create a writable stream to the log file in append mode
    const fileStream = fs.createWriteStream(LOG_FILE_PATH, { flags: 'a' });
    
    // Define all our log destinations
    const logStreams: Writable[] = [fileStream, process.stdout];
    
    let count: number = 0;

    statusLogger.log(`🚀 Writing ${LOGS_PER_SECOND} logs/sec to ${LOG_FILE_PATH} AND stdout for ${TOTAL_DURATION_SECONDS} seconds...`);

    const intervalId = setInterval(() => {
      writeLogBatch(logStreams, count);
      count += LOGS_PER_SECOND;
      statusLogger.log(`✅ Wrote batch #${(count / LOGS_PER_SECOND)}`);

      if (count >= TOTAL_DURATION_SECONDS * LOGS_PER_SECOND) {
        clearInterval(intervalId);
        fileStream.end(() => statusLogger.log('✅ Finished writing logs. File stream closed.'));
      }
    }, 1000);

  } catch (error) {
    statusLogger.error('❌ An error occurred during log generation:', error);
  }
}

// Execute the main function
startLogGeneration();