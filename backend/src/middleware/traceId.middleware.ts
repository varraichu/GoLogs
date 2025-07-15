import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runWithTraceId } from '../utils/trace.util';
import logger from '../config/logger';

const traceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const traceId = uuidv4();

  runWithTraceId(traceId, () => {
    next();
  });
};

export default traceMiddleware;
