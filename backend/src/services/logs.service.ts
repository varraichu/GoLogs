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

/**
 * Retrieves paginated logs with application information for admin users.
 * @param options - Pagination, sorting, and filtering options.
 * @returns A paginated result set containing logs and pagination metadata.
 */
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

/**
 * Retrieves paginated logs with application information for a specific user.
 * @param options - User ID and pagination, sorting, and filtering options.
 * @returns A paginated result set containing logs and pagination metadata.
 */
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

/**
 * Updates the TTL (time to live) for log documents by modifying the index on the `ingested_at` field.
 * @param newTTLInDays - The new TTL duration in days.
 */
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

/**
 * Retrieves the current TTL value (in days) for log documents based on the `ingested_at` index.
 * @returns The TTL value in days, or null if not set.
 */
export const getLogTTLService = async (): Promise<number | null> => {
  const indexes = await Log.collection.indexes();
  const ttlIndex = indexes.find((idx) => idx.name === 'ingested_at_1');

  if (!ttlIndex || typeof ttlIndex.expireAfterSeconds !== 'number') {
    return null;
  }

  return Math.floor(ttlIndex.expireAfterSeconds / (24 * 60 * 60));
};

/**
 * Exports user-specific logs as a CSV string based on filtering and sorting criteria.
 * @param options - User ID, export limit, filters, and sorting criteria.
 * @returns A CSV string containing the exported logs.
 */
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

/**
 * Exports admin-accessible logs as a CSV string based on filtering and sorting criteria.
 * @param options - Export limit, filters, and sorting criteria.
 * @returns A CSV string containing the exported logs.
 */
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

/**
 * Retrieves cached log summaries for applications accessible by the user.
 * @param userId - The ID of the user.
 * @returns An object containing a message and the filtered summaries.
 */
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

/**
 * Retrieves all cached log summaries without filtering.
 * @returns An array of all log summaries.
 */
export const getAllCachedLogSummaryService = async () => {
  return await LogsSummary.find({});
};

/**
 * Triggers a refresh of the log summary by executing the update summary utility.
 */
export const refreshLogGraphService = async (): Promise<void> => {
  await updateLogSummary();
};

/**
 * Fetches a log summary for all applications within a specified date range.
 * @param startDate - The start date of the range.
 * @param endDate - The end date of the range.
 * @returns An aggregated summary of logs for the given period.
 */
export const fetchAllAppsLogSummary = async (startDate: Date, endDate: Date) => {
  const effectiveStartDate = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000);
  const effectiveEndDate = endDate || new Date();

  const pipeline = buildLogSummaryAggregation(effectiveStartDate, effectiveEndDate);
  return await Log.aggregate(pipeline);
};

/**
 * Helper function to retrieve the list of application IDs accessible to a user based on group memberships.
 * @param userId - The ID of the user.
 * @returns An array of accessible application IDs.
 */
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
