// File: services/logs.service.ts
import Log from '../models/Logs';

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
