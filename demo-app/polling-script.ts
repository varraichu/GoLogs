import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const POLL_INTERVAL_MS = 5000; // Poll every 5 seconds
const LOG_FILE_PATH = path.join(__dirname, 'logs', 'polled-logs.log');

const db = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  user: process.env.POSTGRES_USER || 'myuser',
  password: process.env.POSTGRES_PASSWORD || 'mypassword',
  database: process.env.POSTGRES_DB || 'mydb',
  port: 5432,
});

interface LogRow {
  id: number;
  message: string;
  timestamp: string;
  log_type: string;
}

// Persist the last read id in a file
const LAST_ID_FILE = path.join(__dirname, 'logs', 'last-log-id.txt');
let lastReadId = 0;

// Load last read id from file (if exists)
if (fs.existsSync(LAST_ID_FILE)) {
  const content = fs.readFileSync(LAST_ID_FILE, 'utf-8');
  lastReadId = parseInt(content, 10) || 0;
}

async function pollAndWrite(): Promise<void> {
  try {
    const res = await db.query<LogRow>(
      'SELECT * FROM logs WHERE id > $1 ORDER BY id ASC',
      [lastReadId]
    );
    if (res.rows.length > 0) {
      const lines = res.rows.map(row => JSON.stringify(row)).join('\n') + '\n';
      fs.appendFileSync(LOG_FILE_PATH, lines);
      // Update lastReadId and persist it
      lastReadId = res.rows[res.rows.length - 1].id;
      fs.writeFileSync(LAST_ID_FILE, lastReadId.toString());
      console.log(`Wrote ${res.rows.length} new logs, lastReadId now ${lastReadId}`);
    }
  } catch (err) {
    console.error('Polling error:', err);
  }
}

setInterval(pollAndWrite, POLL_INTERVAL_MS);

console.log('Polling script started, writing to', LOG_FILE_PATH);