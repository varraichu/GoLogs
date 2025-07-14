import mongoose from 'mongoose';
import Applications from '../models/Applications';
import UserGroupMembers from '../models/UserGroupMembers';
import UserGroupApplications from '../models/UserGroupApplications';
import Settings from '../models/Settings';

export interface Application {
  _id: string;
  name: string;
  description: string;
  created_at: string;
  is_active: boolean;
  groupCount: number;
  groupNames: string[];
  logCount: number;
  health_status: 'healthy' | 'warning' | 'critical';
}

interface FilterOptions {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'inactive';
  groupIds?: string[];
  userId?: string;
}

const escapeRegex = (text: string) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
};

export const getPaginatedFilteredApplications = async (options: FilterOptions) => {
  const { page, limit, search, status, groupIds, userId } = options;

  const userSettings = userId ? await Settings.findOne({ user_id: userId }) : null;

  const warning_rate_threshold = userSettings?.warning_rate_threshold ?? 10;
  // console.log('Warning Rate Threshold:', warning_rate_threshold);
  // console.log('Error Rate Threshold:', userSettings?.error_rate_threshold);
  const error_rate_threshold = userSettings?.error_rate_threshold ?? 20;
  const oneMinuteAgo = new Date(Date.now() - 60000);

  let accessibleAppIds: mongoose.Types.ObjectId[] | null = null;

  if (userId) {
    const userGroups = await UserGroupMembers.find({
      user_id: userId,
      is_active: true,
      is_removed: false,
    }).select('group_id');

    if (userGroups.length > 0) {
      const userGroupIds = userGroups.map((g) => g.group_id as mongoose.Types.ObjectId);
      const userGroupApps = await UserGroupApplications.find({
        group_id: { $in: userGroupIds },
        is_active: true,
        is_removed: false,
      }).select('app_id');
      accessibleAppIds = userGroupApps.map((a) => a.app_id as mongoose.Types.ObjectId);
    } else {
      accessibleAppIds = [];
    }
  }

  if (accessibleAppIds && accessibleAppIds.length === 0) {
    return {
      applications: [],
      pagination: { total: 0, page, limit, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    };
  }

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
                      { $eq: ['$$appActive', true] }, // ✅ Only include groups if app is active
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

        { $sort: { created_at: -1 } },
        {
          $lookup: {
            from: 'usergroupapplications',
            localField: '_id',
            foreignField: 'app_id',
            as: 'groups',
            pipeline: [{ $match: { is_active: true } }],
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

  const result = await Applications.aggregate(pipeline);
  const data = result[0];
  const applications = data.data;
  const totalDocs = data.metadata[0]?.total || 0;

  return {
    applications,
    pagination: {
      total: totalDocs,
      page,
      limit,
      totalPages: Math.ceil(totalDocs / limit),
      hasNextPage: page * limit < totalDocs,
      hasPrevPage: page > 1,
    },
  };
};

export const getDetailedApplications = async (appIds: mongoose.Types.ObjectId[]) => {
  const detailedApplications = await Applications.aggregate([
    // 1. Filter for the requested, non-deleted applications
    {
      $match: {
        _id: { $in: appIds },
        is_deleted: false,
      },
    },
    // 2. Lookup active groups from the UserGroupApplications collection
    {
      $lookup: {
        from: 'usergroupapplications', // The actual collection name in MongoDB (usually plural and lowercase)
        localField: '_id',
        foreignField: 'app_id',
        as: 'groups',
        pipeline: [
          { $match: { is_active: true, is_removed: false } }, // Only count active groups
        ],
      },
    },

    {
      $lookup: {
        from: 'usergroups', // The collection where group names are stored
        localField: 'groups.group_id', // The field from the previous stage
        foreignField: '_id', // The field to match in the 'usergroups' collection
        as: 'groupDetails', // Store the full group documents here
        pipeline: [
          { $match: { is_deleted: false, is_active: true } }, // Only count active groups
        ],
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
              // Add additional filters here if needed:
              // , created_at: { $gte: new Date('2024-01-01') }
            },
          },
          { $count: 'total' },
        ],
        as: 'logStats',
      },
    },

    // 4. Project the final shape of the output
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        created_at: 1,
        is_active: 1,
        groupCount: { $size: '$groupDetails' }, // Count the number of groups
        groupNames: '$groupDetails.name', // Create an array of just the group names
        logCount: {
          $ifNull: [{ $arrayElemAt: ['$logStats.total', 0] }, 0],
        },
      },
    },
  ]);

  return detailedApplications;
};
