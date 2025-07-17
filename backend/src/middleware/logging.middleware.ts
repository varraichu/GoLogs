import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

// Middleware to log incoming requests
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const { method, originalUrl, body: requestBody, query } = req;

  logger.info(`[Request] ${method} ${originalUrl}`);
  next();
};

export default requestLogger;
