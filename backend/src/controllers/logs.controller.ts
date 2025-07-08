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

interface SortCriteria {
  field: string;
  direction: 'asc' | 'desc';
}

export const getAllLogs = async (req: IAuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    logger.error('Error fetching user logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateLogTTL = async (req: IAuthRequest, res: Response) => {
  try {
    // 1. Destructure and validate the input from the request body
    const { newTTLInDays } = req.body as UpdateLogTTLInput;
    console.log(`Attempting to update log TTL to ${newTTLInDays} days.`);

    if (!newTTLInDays || typeof newTTLInDays !== 'number' || newTTLInDays <= 0) {
      res.status(400).json({ message: 'A valid, positive number for newTTLInDays is required.' });
      return;
    }

    // 2. Prepare for database operation
    const newTTLInSeconds = newTTLInDays * 24 * 60 * 60;
    const Log = mongoose.model('Logs');
    const collection = Log.collection;
    const indexName = 'ingested_at_1'; // Default name for TTL index on 'ingested_at'

    // 3. Drop the existing TTL index. We wrap this in a separate try-catch
    // to handle the specific case where the index doesn't exist.
    try {
      await collection.dropIndex(indexName);
      console.log(`Successfully dropped old TTL index: ${indexName}`);
    } catch (error) {
      // If the index doesn't exist, that's okay. We'll create it.
      if ((error as any).code === 27) {
        console.log(`Index ${indexName} not found, proceeding to create it.`);
      } else {
        // For any other error, we re-throw to be caught by the outer catch block.
        throw error;
      }
    }

    // 4. Create the new TTL index with the updated expiration
    await collection.createIndex({ ingested_at: 1 }, { expireAfterSeconds: newTTLInSeconds });
    console.log(`Successfully created new TTL index with expiration of ${newTTLInDays} days.`);

    // 5. Send a success response
    res
      .status(200)
      .json({ message: `Log TTL has been successfully updated to ${newTTLInDays} days.` });
    return;
  } catch (error) {
    logger.error('Error updating log TTL:', error);
    res.status(500).json({ message: 'Server error while updating TTL.' });
    return;
  }
};

export const getLogTTL = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
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
  } catch (error) {
    logger.error('Error fetching TTL:', error);
    res.status(500).json({ message: 'Server error while fetching TTL.' });
  }
};
