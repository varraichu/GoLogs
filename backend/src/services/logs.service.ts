// File: services/logs.service.ts
import UserGroupMembers from '../models/UserGroupMembers';
import Log from '../models/Logs';
import UserGroupApplications from '../models/UserGroupApplications';
import LogsSummary from '../models/LogsSummary';
import mongoose from 'mongoose';
import { Parser } from 'json2csv';
import { updateLogSummary } from '../utils/updateLogsSummary.util';
import {
  buildPaginatedLogsAggregation,
  buildUserLogsAggregation,
  buildLogSummaryAggregation,
} from '../aggregations/logs.aggregation';

interface SortCriteria {
  field: string;
  direction: 'asc' | 'desc';
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortCriteria?: SortCriteria[];
  filters?: {
    log_type?: string | string[];
    app_name?: string | string[];
    startDate?: string;
    endDate?: string;
    search?: string;
  };
}

interface UserLogsPaginationOptions extends PaginationOptions {
  userId: string;
}

interface ExportUserLogsOptions {
  userId: string;
  limit: number;
  sortCriteria: SortCriteria[];
  filters: {
    log_type?: string | string[];
    app_name?: string | string[];
    startDate?: string;
    endDate?: string;
    search?: string;
  };
}

interface ExportAdminLogsOptions {
  limit: number;
  sortCriteria: SortCriteria[];
  filters: {
    log_type?: string | string[];
    app_name?: string | string[];
    startDate?: string;
    endDate?: string;
    search?: string;
  };
}

export const fetchPaginatedLogsWithAppInfo = async ({
  page,
  limit,
  sortCriteria = [{ field: 'timestamp', direction: 'desc' }],
  filters = {},
}: PaginationOptions) => {
  const skip = (page - 1) * limit;

  const { pipeline, countPipeline } = buildPaginatedLogsAggregation({
    skip,
    limit,
    sortCriteria,
    filters,
  });

  const [logs, totalResult] = await Promise.all([
    Log.aggregate(pipeline),
    Log.aggregate(countPipeline),
  ]);

  const total = totalResult[0]?.total || 0;

  return {
    logs,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: skip + logs.length < total,
      hasPrevPage: page > 1,
    },
  };
};

export const fetchUserLogsWithAppInfo = async ({
  userId,
  page,
  limit,
  sortCriteria = [{ field: 'timestamp', direction: 'desc' }],
  filters = {},
}: UserLogsPaginationOptions) => {
  const skip = (page - 1) * limit;

  // Get user's accessible app IDs
  const appIds = await getUserAccessibleAppIds(userId);

  if (appIds.length === 0) {
    return {
      logs: [],
      total: 0,
      pagination: {
        page,
        limit,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  const { pipeline, countPipeline } = buildUserLogsAggregation({
    appIds,
    skip,
    limit,
    sortCriteria,
    filters,
  });

  const [logs, totalResult] = await Promise.all([
    Log.aggregate(pipeline),
    Log.aggregate(countPipeline),
  ]);

  const total = totalResult[0]?.total || 0;

  return {
    logs,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: skip + logs.length < total,
      hasPrevPage: page > 1,
    },
  };
};

export const updateLogTTLService = async (newTTLInDays: number): Promise<void> => {
  const newTTLInSeconds = newTTLInDays * 24 * 60 * 60;
  const LogModel = mongoose.model('Logs');
  const collection = LogModel.collection;
  const indexName = 'ingested_at_1';

  try {
    await collection.dropIndex(indexName);
  } catch (error) {
    if ((error as any).code !== 27) {
      throw error;
    }
  }

  await collection.createIndex({ ingested_at: 1 }, { expireAfterSeconds: newTTLInSeconds });
};

export const getLogTTLService = async (): Promise<number | null> => {
  const indexes = await Log.collection.indexes();
  const ttlIndex = indexes.find((idx) => idx.name === 'ingested_at_1');

  if (!ttlIndex || typeof ttlIndex.expireAfterSeconds !== 'number') {
    return null;
  }

  return Math.floor(ttlIndex.expireAfterSeconds / (24 * 60 * 60));
};

export const exportUserLogsService = async ({
  userId,
  limit,
  sortCriteria,
  filters,
}: ExportUserLogsOptions): Promise<string> => {
  const { logs } = await fetchUserLogsWithAppInfo({
    userId,
    page: 1,
    limit,
    sortCriteria,
    filters,
  });

  const fields = ['timestamp', 'log_type', 'message', 'app_name', 'ingested_at'];
  const parser = new Parser({ fields });
  return parser.parse(logs);
};

export const exportAdminLogsService = async ({
  limit,
  sortCriteria,
  filters,
}: ExportAdminLogsOptions): Promise<string> => {
  const { logs } = await fetchPaginatedLogsWithAppInfo({
    page: 1,
    limit,
    sortCriteria,
    filters,
  });

  const fields = ['timestamp', 'log_type', 'message', 'app_name', 'ingested_at'];
  const parser = new Parser({ fields });
  return parser.parse(logs);
};

export const getCachedLogSummaryService = async (userId: string) => {
  const appIds = await getUserAccessibleAppIds(userId);

  if (appIds.length === 0) {
    return { message: 'User has no app access', data: [] };
  }

  const summaries = await LogsSummary.find({
    app_id: { $in: appIds },
  });

  return { message: 'User summary fetched', data: summaries };
};

export const getAllCachedLogSummaryService = async () => {
  return await LogsSummary.find({});
};

export const refreshLogGraphService = async (): Promise<void> => {
  await updateLogSummary();
};

export const fetchAllAppsLogSummary = async (startDate: Date, endDate: Date) => {
  const effectiveStartDate = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000);
  const effectiveEndDate = endDate || new Date();

  const pipeline = buildLogSummaryAggregation(effectiveStartDate, effectiveEndDate);
  return await Log.aggregate(pipeline);
};

// Helper function to get user's accessible app IDs
const getUserAccessibleAppIds = async (userId: string): Promise<mongoose.Types.ObjectId[]> => {
  const userGroups = await UserGroupMembers.find({
    user_id: userId,
    is_active: true,
  }).select('group_id');

  const groupIds = userGroups.map((g) => g.group_id as mongoose.Types.ObjectId);

  if (groupIds.length === 0) {
    return [];
  }

  const userGroupApps = await UserGroupApplications.find({
    group_id: { $in: groupIds },
    is_active: true,
  }).select('app_id');

  return userGroupApps.map((g) => g.app_id as mongoose.Types.ObjectId);
};
