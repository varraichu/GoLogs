import mongoose from 'mongoose';

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
  warning_rate_threshold?: number;
  error_rate_threshold?: number;
}

export const getPaginatedFilteredApplicationsPipeline = (options: PaginationOptions) => {
  const {
    page,
    limit,
    search,
    status,
    groupIds,
    accessibleAppIds,
    warning_rate_threshold = 10,
    error_rate_threshold = 20,
  } = options;

  const oneMinuteAgo = new Date(Date.now() - 60000);
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
                    $and: [{ $eq: ['$app_id', '$$appId'] }, { $gte: ['$timestamp', oneMinuteAgo] }],
                  },
                },
              },
              { $count: 'recentLogs' },
            ],
            as: 'recentLogStats',
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
                  recent_logs: {
                    $ifNull: [{ $arrayElemAt: ['$recentLogStats.recentLogs', 0] }, 0],
                  },
                },
                in: {
                  $switch: {
                    branches: [
                      { case: { $gte: ['$$recent_logs', error_rate_threshold] }, then: 'critical' },
                      {
                        case: { $gte: ['$$recent_logs', warning_rate_threshold] },
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
