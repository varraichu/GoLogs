// File: controllers/logs.controller.ts
import { Response } from 'express';
import { IAuthRequest } from '../middleware/auth.middleware';
import logger from '../config/logger';
import { fetchPaginatedLogsWithAppInfo } from '../services/logs.services';

export const getAllLogs = async (req: IAuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { logs, total, pagination } = await fetchPaginatedLogsWithAppInfo({ page, limit });

    res.status(200).json({
      message: 'Logs fetched successfully',
      logs,
      pagination: {
        ...pagination,
        total,
      },
    });
  } catch (error) {
    logger.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
