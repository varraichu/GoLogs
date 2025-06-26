"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// --- Configuration ---
const LOG_FILE_PATH = path.join(__dirname, 'logs', 'app.log');
const LOGS_PER_SECOND = 10;
const TOTAL_DURATION_SECONDS = 1;
const APP_ID = 'demo-app'; // Example App ID
const LOG_TYPES = ['info', 'warn', 'error', 'debug'];
/**
 * Generates a single log line as a JSON string with a random log type.
 * @param index - The index number for the log entry to make it unique.
 * @returns A JSON string representing the log entry, followed by a newline.
 */
function generateLogLine(index) {
    const randomLogType = LOG_TYPES[Math.floor(Math.random() * LOG_TYPES.length)];
    const log = {
        app_id: APP_ID,
        message: `Synthetic log entry #${index}`,
        timestamp: new Date().toISOString(),
        log_type: randomLogType,
        ingested_at: new Date().toISOString(),
    };
    return JSON.stringify(log) + '\n';
}
/**
 * Writes a batch of log lines to the provided write stream.
 * @param stream - The file stream to write to.
 * @param indexStart - The starting index for the log entries in this batch.
 */
function writeLogsToFile(stream, indexStart) {
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
function startLogGeneration() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Ensure the 'logs' directory exists
            const logDir = path.dirname(LOG_FILE_PATH);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
                console.log(`📂 Created log directory at: ${logDir}`);
            }
            // Create a writable stream to the log file in append mode
            const stream = fs.createWriteStream(LOG_FILE_PATH, { flags: 'a' });
            let count = 0;
            console.log(`🚀 Writing ${LOGS_PER_SECOND} logs/sec to ${LOG_FILE_PATH} for ${TOTAL_DURATION_SECONDS} seconds...`);
            for (let i = 0; i < TOTAL_DURATION_SECONDS; i++) {
                writeLogsToFile(stream, count);
                count += LOGS_PER_SECOND;
                console.log(`✅ Wrote batch #${i + 1}`);
                // Wait for 1 second before writing the next batch
                yield new Promise(resolve => setTimeout(resolve, 1000));
            }
            stream.end(() => console.log('✅ Finished writing logs.'));
        }
        catch (error) {
            console.error('❌ An error occurred during log generation:', error);
        }
    });
}
// Execute the main function
startLogGeneration();
