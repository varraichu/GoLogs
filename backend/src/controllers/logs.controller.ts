// File: controllers/logs.controller.ts
import { Response } from 'express';
import { IAuthRequest } from '../middleware/auth.middleware';
import logger from '../config/logger';
import { fetchPaginatedLogsWithAppInfo, fetchUserLogsWithAppInfo } from '../services/logs.service';
import UserGroupMembers from '../models/UserGroupMembers';
import mongoose from 'mongoose';
import UserGroupApplications from '../models/UserGroupApplications';
import { UserIdParams } from '../schemas/application.validator';
import { UpdateLogTTLInput, LogsQueryInput, logsQuerySchema } from '../schemas/logs.validator';
import Logs from '../models/Logs';
import LogsSummary from '../models/LogsSummary';
import { updateLogSummary } from '../scripts/updateLogsSummary';

import { Parser } from 'json2csv'; // for CSV conversion

interface SortCriteria {
  field: string;
  direction: 'asc' | 'desc';
}

export const getAllLogs = async (req: IAuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const sort = req.query.sort as string | undefined;
  const log_type = req.query.log_type as string | string[] | undefined;
  const app_name = req.query.app_name as string | string[] | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const search = req.query.search as string | undefined;

  const sortCriteria: SortCriteria[] = sort
    ? sort.split(',').map((item) => {
        const [field, direction] = item.split(':');
        return {
          field: field.trim(),
          direction: direction?.trim() === 'asc' ? 'asc' : 'desc',
        } as SortCriteria;
      })
    : [{ field: 'timestamp', direction: 'desc' }];

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
  return;
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

  const sortCriteria: SortCriteria[] = sort
    ? sort.split(',').map((item) => {
        const [field, direction] = item.split(':');
        return {
          field: field.trim(),
          direction: direction?.trim() === 'asc' ? 'asc' : 'desc',
        } as SortCriteria;
      })
    : [{ field: 'timestamp', direction: 'desc' }];

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
  return;
};

export const updateLogTTL = async (req: IAuthRequest, res: Response) => {
  const { newTTLInDays } = req.body as UpdateLogTTLInput;
  // console.log(`Attempting to update log TTL to ${newTTLInDays} days.`);

  if (!newTTLInDays || typeof newTTLInDays !== 'number' || newTTLInDays <= 0) {
    res.status(400).json({ message: 'A valid, positive number for newTTLInDays is required.' });
    return;
  }

  const newTTLInSeconds = newTTLInDays * 24 * 60 * 60;
  const Log = mongoose.model('Logs');
  const collection = Log.collection;
  const indexName = 'ingested_at_1';

  try {
    await collection.dropIndex(indexName);
    // console.log(`Successfully dropped old TTL index: ${indexName}`);
  } catch (error) {
    if ((error as any).code === 27) {
      // console.log(`Index ${indexName} not found, proceeding to create it.`);
    } else {
      throw error;
    }
  }

  await collection.createIndex({ ingested_at: 1 }, { expireAfterSeconds: newTTLInSeconds });
  // console.log(`Successfully created new TTL index with expiration of ${newTTLInDays} days.`);

  res
    .status(200)
    .json({ message: `Log TTL has been successfully updated to ${newTTLInDays} days.` });
  return;
};

export const getLogTTL = async (req: IAuthRequest, res: Response): Promise<void> => {
  const indexes = await Logs.collection.indexes();
  const ttlIndex = indexes.find((idx) => idx.name === 'ingested_at_1');

  if (!ttlIndex || typeof ttlIndex.expireAfterSeconds !== 'number') {
    res.status(404).json({ message: 'TTL index not found on ingested_at field.' });
    return;
  }

  const ttlInDays = Math.floor(ttlIndex.expireAfterSeconds / (24 * 60 * 60));

  res.status(200).json({
    message: 'TTL fetched successfully.',
    ttlInDays,
  });
  return;
};

export const exportUserLogs = async (req: IAuthRequest, res: Response) => {
  const { userId } = req.params as UserIdParams;

  // Convert query params
  const page = 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const sort = req.query.sort as string | undefined;

  const log_type = req.query.log_type as string | string[] | undefined;
  const app_name = req.query.app_name as string | string[] | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const search = req.query.search as string | undefined;

  const sortCriteria: SortCriteria[] = sort
    ? sort.split(',').map((item) => {
        const [field, direction] = item.split(':');
        return {
          field: field.trim(),
          direction: direction?.trim() === 'asc' ? 'asc' : 'desc',
        } as SortCriteria;
      })
    : [{ field: 'timestamp', direction: 'desc' }];

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

  // Convert logs to CSV
  const fields = ['timestamp', 'log_type', 'message', 'app_name', 'ingested_at'];
  const parser = new Parser({ fields });
  const csv = parser.parse(logs);

  res.header('Content-Type', 'text/csv');
  res.attachment('logs-export.csv');
  res.send(csv);
  return;
};

export const exportAdminLogs = async (req: IAuthRequest, res: Response) => {
  // const { userId } = req.params as UserIdParams;

  // Convert query params
  const page = 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const sort = req.query.sort as string | undefined;

  const log_type = req.query.log_type as string | string[] | undefined;
  const app_name = req.query.app_name as string | string[] | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const search = req.query.search as string | undefined;

  const sortCriteria: SortCriteria[] = sort
    ? sort.split(',').map((item) => {
        const [field, direction] = item.split(':');
        return {
          field: field.trim(),
          direction: direction?.trim() === 'asc' ? 'asc' : 'desc',
        } as SortCriteria;
      })
    : [{ field: 'timestamp', direction: 'desc' }];

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

  // Convert logs to CSV
  const fields = ['timestamp', 'log_type', 'message', 'app_name', 'ingested_at'];
  const parser = new Parser({ fields });
  const csv = parser.parse(logs);

  res.header('Content-Type', 'text/csv');
  res.attachment('logs-export.csv');
  res.send(csv);
  return;
};

export const getCachedLogSummary = async (req: IAuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params as UserIdParams;

  const userGroups = await UserGroupMembers.find({
    user_id: userId,
    is_active: true,
  }).select('group_id');

  const groupIds = userGroups.map((userGroup) => userGroup.group_id);

  if (groupIds.length === 0) {
    res.status(200).json({ message: 'User has no groups', data: [] });
  }

  const groupApps = await UserGroupApplications.find({
    group_id: { $in: groupIds },
    is_active: true,
  }).select('app_id');

  const appIds = groupApps.map((groupApp) => groupApp.app_id);

  if (appIds.length === 0) {
    res.status(200).json({ message: 'User has no app access', data: [] });
  }

  const summaries = await LogsSummary.find({
    app_id: { $in: appIds },
  });

  res.status(200).json({ message: 'User summary fetched', data: summaries });
  return;
};

export const getAllCachedLogSummary = async (req: IAuthRequest, res: Response): Promise<void> => {
  const summaries = await LogsSummary.find({});

  res.status(200).json({ message: 'Admin summaries fetched', data: summaries });
  return;
};

export const refreshLogGraph = async (req: IAuthRequest, res: Response) => {
  await updateLogSummary();
  res.status(200).json({ message: 'Log graph refresh' });
  return;
};
