// File: services/logs.service.ts
import UserGroupMembers from '../models/UserGroupMembers';
import Log from '../models/Logs';
import UserGroupApplications from '../models/UserGroupApplications';
import mongoose from 'mongoose';

interface PaginationOptions {
  page: number;
  limit: number;
}

export const fetchPaginatedLogsWithAppInfo = async ({ page, limit }: PaginationOptions) => {
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    Log.aggregate([
      {
        $lookup: {
          from: 'applications',
          localField: 'app_id',
          foreignField: '_id',
          as: 'application',
        },
      },
      { $unwind: '$application' },
      { $match: { 'application.is_active': true } },
      { $sort: { timestamp: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          message: 1,
          timestamp: 1,
          log_type: 1,
          ingested_at: 1,
          app_id: 1,
          app_name: '$application.name',
        },
      },
    ]),
    Log.aggregate([
      {
        $lookup: {
          from: 'applications',
          localField: 'app_id',
          foreignField: '_id',
          as: 'application',
        },
      },
      { $unwind: '$application' },
      { $match: { 'application.is_active': true } },
      { $count: 'total' },
    ]).then((result) => result[0]?.total || 0),
  ]);

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

interface UserLogsPaginationOptions {
  userId: string;
  page: number;
  limit: number;
}

export const fetchUserLogsWithAppInfo = async ({
  userId,
  page,
  limit,
}: UserLogsPaginationOptions) => {
  const skip = (page - 1) * limit;

  // First, get the user's accessible app IDs
  const userGroups = await UserGroupMembers.find({
    user_id: userId,
    is_active: true,
  }).select('group_id');

  const groupIds = userGroups.map((g) => g.group_id as mongoose.Types.ObjectId);

  if (groupIds.length === 0) {
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

  const userGroupApps = await UserGroupApplications.find({
    group_id: { $in: groupIds },
    is_active: true,
  }).select('app_id');

  const appIds = userGroupApps.map((g) => g.app_id as mongoose.Types.ObjectId);

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

  // Now fetch logs for these applications
  const [logs, total] = await Promise.all([
    Log.aggregate([
      {
        $match: {
          app_id: { $in: appIds },
        },
      },
      {
        $lookup: {
          from: 'applications',
          localField: 'app_id',
          foreignField: '_id',
          as: 'application',
        },
      },
      { $unwind: '$application' },
      { $match: { 'application.is_active': true } },
      { $sort: { timestamp: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          message: 1,
          timestamp: 1,
          log_type: 1,
          ingested_at: 1,
          app_id: 1,
          app_name: '$application.name',
        },
      },
    ]),
    Log.aggregate([
      {
        $match: {
          app_id: { $in: appIds },
        },
      },
      {
        $lookup: {
          from: 'applications',
          localField: 'app_id',
          foreignField: '_id',
          as: 'application',
        },
      },
      { $unwind: '$application' },
      { $match: { 'application.is_active': true } },
      { $count: 'total' },
    ]).then((result) => result[0]?.total || 0),
  ]);

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
