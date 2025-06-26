import * as fs from 'fs';
import * as path from 'path';

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
 * Writes a batch of log lines to the provided write stream.
 * @param stream - The file stream to write to.
 * @param indexStart - The starting index for the log entries in this batch.
 */
function writeLogsToFile(stream: fs.WriteStream, indexStart: number): void {
  for (let i = 0; i < LOGS_PER_SECOND; i++) {
    const logLine = generateLogLine(indexStart + i);
    stream.write(logLine);
  }
}

/**
 * Main function to start the log generation process.
 * It creates a directory and file if they don't exist,
 * then writes logs periodically.
 */
async function startLogGeneration(): Promise<void> {
  try {
    // Ensure the 'logs' directory exists
    const logDir = path.dirname(LOG_FILE_PATH);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
      console.log(`📂 Created log directory at: ${logDir}`);
    }
    
    // Create a writable stream to the log file in append mode
    const stream = fs.createWriteStream(LOG_FILE_PATH, { flags: 'a' });
    let count: number = 0;

    console.log(`🚀 Writing ${LOGS_PER_SECOND} logs/sec to ${LOG_FILE_PATH} for ${TOTAL_DURATION_SECONDS} seconds...`);

    for (let i = 0; i < TOTAL_DURATION_SECONDS; i++) {
      writeLogsToFile(stream, count);
      count += LOGS_PER_SECOND;
      console.log(`✅ Wrote batch #${i + 1}`);
      // Wait for 1 second before writing the next batch
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    stream.end(() => console.log('✅ Finished writing logs.'));

  } catch (error) {
    console.error('❌ An error occurred during log generation:', error);
  }
}

// Execute the main function
startLogGeneration();
