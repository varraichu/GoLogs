import winston from 'winston';
import config from 'config';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { getTraceId } from '../utils/trace.util';
const { combine, timestamp, printf } = winston.format;

// Returns current timestamp in configured format.
const timezoned = () => {
  const date_format = config.get('date_format');
  if (date_format == 'ABSOLUTE') {
    return dayjs().format('HH:mm:ss,SSS');
  } else if (date_format === 'DATE') {
    return dayjs().format('DD MMM YYYY HH:mm:ss,SSS');
  }

  return dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS');
};

// Defines log message format including timestamp, level, trace ID, and message.
const logFormat = printf(({ level, message, timestamp }) => {
  const traceId = getTraceId();
  return `[${timestamp}] [${level.toUpperCase()}] [${traceId}] ${message}`;
});

// Winston logger setup with console and file transports.
const logger = winston.createLogger({
  level: config.get('logger.level'),
  format: combine(
    timestamp({
      format: timezoned,
    }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(timestamp(), logFormat),
    }),
    //new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/all.log' }),
  ],
});

export default logger;
