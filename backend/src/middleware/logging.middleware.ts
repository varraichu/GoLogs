import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const { method, originalUrl, body: requestBody, query } = req;

  logger.info(`[Request] ${method} ${originalUrl}`);
  // if (requestBody) {
  //   logger.info(`[Request Body] ${JSON.stringify(requestBody)}`);
  // }

  // if (Object.keys(query).length > 0) {
  //   logger.info(`[Query Params] ${JSON.stringify(query)}`);
  // }

  next();
};

export default requestLogger;
