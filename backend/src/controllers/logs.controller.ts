// File: controllers/logs.controller.ts
import { Response } from 'express';
import { IAuthRequest } from '../middleware/auth.middleware';
import logger from '../config/logger';
import { fetchPaginatedLogsWithAppInfo, fetchUserLogsWithAppInfo } from '../services/logs.service';
import UserGroupMembers from '../models/UserGroupMembers';
import mongoose from 'mongoose';
import UserGroupApplications from '../models/UserGroupApplications';
import { UserIdParams } from '../schemas/application.validator';

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

export const getUserLogs = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params as UserIdParams;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    console.log('Fetching logs for user ID:', userId);

    const { logs, total, pagination } = await fetchUserLogsWithAppInfo({ userId, page, limit });

    res.status(200).json({
      message: 'User logs fetched successfully',
      logs,
      pagination: {
        ...pagination,
        total,
      },
    });
  } catch (error) {
    logger.error('Error fetching user logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
