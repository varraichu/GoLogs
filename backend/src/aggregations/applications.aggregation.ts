import mongoose from 'mongoose';

/**
 * Escapes special characters in a string to safely use it in a MongoDB regex.
 * @param text - The input text to be escaped.
 * @returns The escaped text.
 */
const escapeRegex = (text: string) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
};

interface PaginationOptions {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'inactive';
  groupIds?: string[];
  accessibleAppIds?: mongoose.Types.ObjectId[];
  userId?: string;
}

/**
 * Builds a MongoDB aggregation pipeline to retrieve paginated and filtered applications.
 * Applies search, status filtering, group-based filtering, and access control.
 * Includes log count and health status evaluation (healthy, warning, critical).
 * @param options - Options to filter, paginate, and evaluate application health.
 * @returns An aggregation pipeline array.
 */
export const getPaginatedFilteredApplicationsPipeline = (options: PaginationOptions) => {
  const { page, limit, search, status, groupIds, accessibleAppIds, userId } = options;

  const oneHourAgo = new Date(Date.now() - 3600000);
  const pipeline: any[] = [];
  const matchStage: any = { is_deleted: false };

  if (accessibleAppIds) {
    matchStage._id = { $in: accessibleAppIds };
  }

  if (status) {
    matchStage.is_active = status === 'active';
  }

  if (search) {
    const searchParts = search.split(' ').map((part) => escapeRegex(part));
    const flexibleSearchRegex = searchParts.join('.*');
    matchStage.$or = [
      { name: { $regex: flexibleSearchRegex, $options: 'i' } },
      { description: { $regex: flexibleSearchRegex, $options: 'i' } },
    ];
  }

  pipeline.push({ $match: matchStage });

  if (groupIds && groupIds.length > 0) {
    pipeline.push(
      {
        $lookup: {
          from: 'usergroupapplications',
          localField: '_id',
          foreignField: 'app_id',
          as: 'groupAssignments',
        },
      },
      {
        $match: {
          'groupAssignments.group_id': {
            $in: groupIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
      }
    );
  }

  pipeline.push({
    $facet: {
      metadata: [{ $count: 'total' }],
      data: [
        {
          $lookup: {
            from: 'usergroupapplications',
            localField: '_id',
            foreignField: 'app_id',
            as: 'groups',
            pipeline: [{ $match: { is_active: true, is_removed: false } }],
          },
        },
        {
          $lookup: {
            from: 'usergroups',
            let: { groupIds: '$groups.group_id', appActive: '$is_active' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $in: ['$_id', '$$groupIds'] },
                      { $eq: ['$is_deleted', false] },
                      { $eq: ['$is_active', true] },
                      { $eq: ['$$appActive', true] },
                    ],
                  },
                },
              },
            ],
            as: 'groupDetails',
          },
        },
        {
          $lookup: {
            from: 'logs',
            let: { appId: '$_id' },
            pipeline: [{ $match: { $expr: { $eq: ['$app_id', '$$appId'] } } }, { $count: 'total' }],
            as: 'logStats',
          },
        },

        {
          $lookup: {
            from: 'logs',
            let: { appId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$app_id', '$$appId'] },
                      { $gte: ['$timestamp', oneHourAgo] },
                      { $eq: ['$log_type', 'error'] },
                    ],
                  },
                },
              },
              { $count: 'count' },
            ],
            as: 'recentErrorStats',
          },
        },

        {
          $lookup: {
            from: 'logs',
            let: { appId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$app_id', '$$appId'] },
                      { $gte: ['$timestamp', oneHourAgo] },
                      { $eq: ['$log_type', 'warn'] },
                    ],
                  },
                },
              },
              { $count: 'count' },
            ],
            as: 'recentWarningStats',
          },
        },

        {
          $lookup: {
            from: 'settings',
            pipeline: [{ $match: { user_id: new mongoose.Types.ObjectId(userId) } }, { $limit: 1 }],
            as: 'userSettings',
          },
        },
        {
          $addFields: {
            settings: { $ifNull: [{ $arrayElemAt: ['$userSettings', 0] }, {}] },
          },
        },

        { $sort: { created_at: -1 } },

        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            created_at: 1,
            is_active: 1,
            groupCount: { $size: '$groupDetails' },
            groupNames: '$groupDetails.name',
            logCount: { $ifNull: [{ $arrayElemAt: ['$logStats.total', 0] }, 0] },
            health_status: {
              $let: {
                vars: {
                  error_logs: { $ifNull: [{ $arrayElemAt: ['$recentErrorStats.count', 0] }, 0] },
                  warning_logs: {
                    $ifNull: [{ $arrayElemAt: ['$recentWarningStats.count', 0] }, 0],
                  },
                  error_threshold: { $ifNull: ['$settings.error_rate_threshold', 20] },
                  warning_threshold: { $ifNull: ['$settings.warning_rate_threshold', 10] },
                },
                in: {
                  $switch: {
                    branches: [
                      { case: { $gte: ['$$error_logs', '$$error_threshold'] }, then: 'critical' },
                      {
                        case: { $gte: ['$$warning_logs', '$$warning_threshold'] },
                        then: 'warning',
                      },
                    ],
                    default: 'healthy',
                  },
                },
              },
            },
          },
        },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ],
    },
  });

  return pipeline;
};

/**
 * Builds a MongoDB aggregation pipeline to retrieve detailed application information.
 * Includes related group names and total log count.
 * @param appIds - An array of application IDs to fetch.
 * @returns An aggregation pipeline array.
 */
export const getDetailedApplicationsPipeline = (appIds: mongoose.Types.ObjectId[]) => {
  return [
    {
      $match: {
        _id: { $in: appIds },
        is_deleted: false,
      },
    },
    {
      $lookup: {
        from: 'usergroupapplications',
        localField: '_id',
        foreignField: 'app_id',
        as: 'groups',
        pipeline: [{ $match: { is_active: true, is_removed: false } }],
      },
    },
    {
      $lookup: {
        from: 'usergroups',
        localField: 'groups.group_id',
        foreignField: '_id',
        as: 'groupDetails',
        pipeline: [{ $match: { is_deleted: false, is_active: true } }],
      },
    },
    {
      $lookup: {
        from: 'logs',
        let: { appId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$app_id', '$$appId'] },
            },
          },
          { $count: 'total' },
        ],
        as: 'logStats',
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        created_at: 1,
        is_active: 1,
        groupCount: { $size: '$groupDetails' },
        groupNames: '$groupDetails.name',
        logCount: {
          $ifNull: [{ $arrayElemAt: ['$logStats.total', 0] }, 0],
        },
      },
    },
  ];
};

/**
 * Builds a MongoDB aggregation pipeline to count logs by type for a given application.
 * @param appId - The application ID to retrieve log counts for.
 * @returns An aggregation pipeline array that groups logs by type.
 */
export const getAppCriticalLogsPipeline = (appId: string) => {
  return [
    { $match: { app_id: new mongoose.Types.ObjectId(appId) } },
    {
      $group: {
        _id: '$log_type',
        count: { $sum: 1 },
      },
    },
  ];
};
