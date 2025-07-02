import winston from 'winston';

const { combine, timestamp, printf } = winston.format;

const getTraceId = (): string => {
  return 'traceid';
};

const logFormat = printf(({ level, message, timestamp }) => {
  const traceId = getTraceId();
  return `[${timestamp}] [${level.toUpperCase()}] [${traceId}] ${message}`;
});

const logger = winston.createLogger({
  level: "debug",
  format: combine(timestamp(), logFormat),
  transports: [
    new winston.transports.Console({
      format: combine(timestamp(), logFormat),
    }),
    //new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/all.log' }),
  ],
});

export default logger;