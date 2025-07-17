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

// Parses sort query parameter into an array of SortCriteria objects.
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

/**
 * Fetches paginated logs with filters and sorting.
 * @param req Auth request with query filters
 * @returns JSON with log entries and pagination info
 */
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

/**
 * Fetches paginated user-specific logs with filters.
 * @param req Auth request with userId and filters
 * @returns JSON with user's logs and pagination data
 */
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

/**
 * Updates the Time-To-Live (TTL) value for logs.
 * @param req Body with newTTLInDays
 * @returns Success message with updated TTL days
 */
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

/**
 * Retrieves the current TTL (retention) setting for logs.
 * @param req Auth request
 * @returns TTL value in days or not found message
 */
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

/**
 * Exports filtered logs of a user to a downloadable CSV.
 * @param req Params with userId and query filters
 * @returns Sends CSV file with matching user logs
 */
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

/**
 * Exports admin logs (across users/apps) as CSV.
 * @param req Query filters
 * @returns Sends CSV file with matching logs
 */
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

// Fetches cached log summary for a specific user.
export const getCachedLogSummary = async (req: IAuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params as UserIdParams;

  const { message, data } = await getCachedLogSummaryService(userId);

  res.status(200).json({ message, data });
};

// Fetches all cached log summaries for admin.
export const getAllCachedLogSummary = async (req: IAuthRequest, res: Response): Promise<void> => {
  const summaries = await getAllCachedLogSummaryService();

  res.status(200).json({ message: 'Admin summaries fetched', data: summaries });
};

// Refreshes the log graph data.
export const refreshLogGraph = async (req: IAuthRequest, res: Response) => {
  await refreshLogGraphService();
  res.status(200).json({ message: 'Log graph refresh' });
};
