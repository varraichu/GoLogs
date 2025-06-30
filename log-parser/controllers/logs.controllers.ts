import logs from '../models/logs';
import {
  InsertLogToDBInput
} from '../schemas/logs.validator';

export const insertLogs = async (logData: InsertLogToDBInput) => {
  try {

    const newLog = await logs.create(logData);
    return newLog;
  } catch (error: any) {
    console.error('Error inserting log:', error);
    throw error;
  }
};