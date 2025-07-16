// File: controllers/logs.controller.ts
import { Response } from 'express';
import { IAuthRequest } from '../middleware/auth.middleware';
import logger from '../config/logger';
import {
  fetchPaginatedLogsWithAppInfo,
  fetchUserLogsWithAppInfo,
  updateLogTTLService,
  getLogTTLService,
  exportUserLogsService,
  exportAdminLogsService,
  getCachedLogSummaryService,
  getAllCachedLogSummaryService,
  refreshLogGraphService,
} from '../services/logs.service';
import { UserIdParams } from '../schemas/application.validator';
import { UpdateLogTTLInput } from '../schemas/logs.validator';

interface SortCriteria {
  field: string;
  direction: 'asc' | 'desc';
}

const parseSortCriteria = (sort: string | undefined): SortCriteria[] => {
  return sort
    ? sort.split(',').map((item) => {
        const [field, direction] = item.split(':');
        return {
          field: field.trim(),
          direction: direction?.trim() === 'asc' ? 'asc' : 'desc',
        } as SortCriteria;
      })
    : [{ field: 'timestamp', direction: 'desc' }];
};

export const getAllLogs = async (req: IAuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const sort = req.query.sort as string | undefined;
  const log_type = req.query.log_type as string | string[] | undefined;
  const app_name = req.query.app_name as string | string[] | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const search = req.query.search as string | undefined;

  const sortCriteria = parseSortCriteria(sort);

  const filters = {
    log_type,
    app_name,
    startDate,
    endDate,
    search,
  };

  const { logs, total, pagination } = await fetchPaginatedLogsWithAppInfo({
    page,
    limit,
    sortCriteria,
    filters,
  });

  res.status(200).json({
    message: 'Logs fetched successfully',
    logs,
    pagination: {
      ...pagination,
      total,
    },
  });
};

export const getUserLogs = async (req: IAuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params as UserIdParams;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const sort = req.query.sort as string | undefined;
  const log_type = req.query.log_type as string | string[] | undefined;
  const app_name = req.query.app_name as string | string[] | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const search = req.query.search as string | undefined;

  const sortCriteria = parseSortCriteria(sort);

  const filters = {
    log_type,
    app_name,
    startDate,
    endDate,
    search,
  };

  const { logs, total, pagination } = await fetchUserLogsWithAppInfo({
    userId,
    page,
    limit,
    sortCriteria,
    filters,
  });

  res.status(200).json({
    message: 'User logs fetched successfully',
    logs,
    pagination: {
      ...pagination,
      total,
    },
  });
};

export const updateLogTTL = async (req: IAuthRequest, res: Response) => {
  const { newTTLInDays } = req.body as UpdateLogTTLInput;

  if (!newTTLInDays || typeof newTTLInDays !== 'number' || newTTLInDays <= 0) {
    res.status(400).json({ message: 'A valid, positive number for newTTLInDays is required.' });
    return;
  }

  await updateLogTTLService(newTTLInDays);

  res.status(200).json({
    message: `Log TTL has been successfully updated to ${newTTLInDays} days.`,
  });
};

export const getLogTTL = async (req: IAuthRequest, res: Response): Promise<void> => {
  const ttlInDays = await getLogTTLService();

  if (ttlInDays === null) {
    res.status(404).json({ message: 'TTL index not found on ingested_at field.' });
    return;
  }

  res.status(200).json({
    message: 'TTL fetched successfully.',
    ttlInDays,
  });
};

export const exportUserLogs = async (req: IAuthRequest, res: Response) => {
  const { userId } = req.params as UserIdParams;
  const limit = parseInt(req.query.limit as string) || 20;
  const sort = req.query.sort as string | undefined;
  const log_type = req.query.log_type as string | string[] | undefined;
  const app_name = req.query.app_name as string | string[] | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const search = req.query.search as string | undefined;

  const sortCriteria = parseSortCriteria(sort);

  const filters = {
    log_type,
    app_name,
    startDate,
    endDate,
    search,
  };

  const csv = await exportUserLogsService({
    userId,
    limit,
    sortCriteria,
    filters,
  });

  res.header('Content-Type', 'text/csv');
  res.attachment('logs-export.csv');
  res.send(csv);
};

export const exportAdminLogs = async (req: IAuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const sort = req.query.sort as string | undefined;
  const log_type = req.query.log_type as string | string[] | undefined;
  const app_name = req.query.app_name as string | string[] | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const search = req.query.search as string | undefined;

  const sortCriteria = parseSortCriteria(sort);

  const filters = {
    log_type,
    app_name,
    startDate,
    endDate,
    search,
  };

  const csv = await exportAdminLogsService({
    limit,
    sortCriteria,
    filters,
  });

  res.header('Content-Type', 'text/csv');
  res.attachment('logs-export.csv');
  res.send(csv);
};

export const getCachedLogSummary = async (req: IAuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params as UserIdParams;

  const { message, data } = await getCachedLogSummaryService(userId);

  res.status(200).json({ message, data });
};

export const getAllCachedLogSummary = async (req: IAuthRequest, res: Response): Promise<void> => {
  const summaries = await getAllCachedLogSummaryService();

  res.status(200).json({ message: 'Admin summaries fetched', data: summaries });
};

export const refreshLogGraph = async (req: IAuthRequest, res: Response) => {
  await refreshLogGraphService();
  res.status(200).json({ message: 'Log graph refresh' });
};
