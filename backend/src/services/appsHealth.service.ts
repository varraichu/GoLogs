import mongoose from 'mongoose';
import Settings from '../models/Settings';
import UserGroupMember from '../models/UserGroupMembers';
import UserGroupApplication from '../models/UserGroupApplications';
import Application from '../models/Applications';
import Logs from '../models/Logs';
import UserGroup from '../models/UserGroups';
import logger from '../config/logger';

type CriticalApp = {
  app_id: mongoose.Types.ObjectId;
  app_name: string;
  errors: number;
  warnings: number;
  exceedsError: boolean;
  exceedsWarning: boolean;
};

export async function getAppsHealthData(userId: mongoose.Types.ObjectId) {
  const settings = await Settings.findOne({ user_id: new mongoose.Types.ObjectId(userId) });

  if (!settings) {
    logger.error('Settings not found for user_id:', userId);
    throw new Error('User settings not found');
  }

  const { error_rate_threshold, warning_rate_threshold, silent_duration } = settings;

  // --- Determine user's accessible applications ---
  const adminGroup = await UserGroup.findOne({ name: 'Admin Group', is_deleted: false });
  const isAdmin =
    adminGroup &&
    (await UserGroupMember.findOne({
      user_id: userId,
      group_id: adminGroup._id,
      is_active: true,
      is_removed: false,
    }));

  let apps;
  if (isAdmin) {
    // Admins can access all active applications
    apps = await Application.find({ is_deleted: false, is_active: true }).select(
      '_id name created_at'
    );
  } else {
    // Non-admins access apps through their user groups
    const groupIds = await UserGroupMember.find({
      user_id: userId,
      is_active: true,
      is_removed: false,
    }).distinct('group_id');
    const appIds = await UserGroupApplication.find({
      group_id: { $in: groupIds },
      is_active: true,
      is_removed: false,
    }).distinct('app_id');
    apps = await Application.find({
      _id: { $in: appIds },
      is_deleted: false,
      is_active: true,
    }).select('_id name created_at');
  }

  const accessibleAppIds = apps.map((a) => a._id);
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const silentCutoff = new Date(Date.now() - silent_duration * 60 * 60 * 1000);

  // --- AGGREGATION 1: Find Critical Apps (Errors & Warnings) ---
  // This pipeline is efficient because it only scans logs from the last minute.
  const criticalApps: CriticalApp[] = await Logs.aggregate([
    {
      $match: {
        app_id: { $in: accessibleAppIds },
        timestamp: { $gte: oneMinuteAgo },
        log_type: { $in: ['error', 'warn'] },
      },
    },
    {
      $group: {
        _id: { app_id: '$app_id', type: '$log_type' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.app_id',
        counts: { $push: { type: '$_id.type', count: '$count' } },
      },
    },
    {
      $project: {
        app_id: '$_id',
        _id: 0,
        errors: {
          $reduce: {
            input: '$counts',
            initialValue: 0,
            in: {
              $cond: [
                { $eq: ['$$this.type', 'error'] },
                { $add: ['$$value', '$$this.count'] },
                '$$value',
              ],
            },
          },
        },
        warnings: {
          $reduce: {
            input: '$counts',
            initialValue: 0,
            in: {
              $cond: [
                { $eq: ['$$this.type', 'warn'] },
                { $add: ['$$value', '$$this.count'] },
                '$$value',
              ],
            },
          },
        },
      },
    },
    {
      $addFields: {
        exceedsError: { $gt: ['$errors', error_rate_threshold] },
        exceedsWarning: { $gt: ['$warnings', warning_rate_threshold] },
      },
    },
    {
      $lookup: {
        from: 'applications',
        localField: 'app_id',
        foreignField: '_id',
        as: 'app',
      },
    },
    { $unwind: '$app' },
    {
      $project: {
        app_id: 1,
        app_name: '$app.name',
        errors: 1,
        warnings: 1,
        exceedsError: 1,
        exceedsWarning: 1,
      },
    },
  ]);

  // --- AGGREGATION 2: Find Silent Apps ---
  // This pipeline starts from Applications to correctly find apps that have NEVER logged.
  const silentApps = await Application.aggregate([
    {
      $match: {
        _id: { $in: accessibleAppIds },
      },
    },
    {
      $lookup: {
        from: 'logs',
        let: { appId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$app_id', '$$appId'] } } },
          { $sort: { timestamp: -1 } },
          { $limit: 1 },
        ],
        as: 'last_log_info',
      },
    },
    {
      $unwind: {
        path: '$last_log_info',
        preserveNullAndEmptyArrays: true, // CRITICAL: Keep apps that have no logs
      },
    },
    {
      $addFields: {
        last_log_timestamp: '$last_log_info.timestamp',
      },
    },
    {
      $match: {
        $or: [
          // Case 1: App has logs, but the last one is before the silent cutoff
          { last_log_timestamp: { $lt: silentCutoff } },
          // Case 2: App has NO logs, and was created before the silent cutoff
          {
            $and: [
              { last_log_timestamp: { $exists: false } },
              { created_at: { $lt: silentCutoff } },
            ],
          },
        ],
      },
    },
    {
      $project: {
        _id: 0,
        app_id: '$_id',
        app_name: '$name',
        last_seen: { $ifNull: ['$last_log_timestamp', null] },
        minutes_ago: {
          $cond: {
            if: { $not: ['$last_log_timestamp'] },
            then: 'Never',
            else: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$last_log_timestamp'] },
                  1000 * 60, // ms to minutes
                ],
              },
            },
          },
        },
      },
    },
  ]);

  // --- Combine results into the required format ---
  return {
    critical_summary: {
      total_errors: criticalApps.reduce((sum, item) => sum + item.errors, 0),
      total_warnings: criticalApps.reduce((sum, item) => sum + item.warnings, 0),
      appsExceedingErrorThreshold: criticalApps.filter((c) => c.exceedsError),
      appsExceedingWarningThreshold: criticalApps.filter((c) => c.exceedsWarning),
    },
    silent_summary: {
      silent_app_count: silentApps.length,
      silent_apps: silentApps,
    },
  };
}
