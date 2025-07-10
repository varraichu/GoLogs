import mongoose from 'mongoose';
import Applications from '../models/Applications';
import UserGroupMembers from '../models/UserGroupMembers';
import UserGroupApplications from '../models/UserGroupApplications';

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

  let accessibleAppIds: mongoose.Types.ObjectId[] | null = null;

  if (userId) {
    const userGroups = await UserGroupMembers.find({
      user_id: userId,
      is_active: true,
    }).select('group_id');

    if (userGroups.length > 0) {
      const userGroupIds = userGroups.map((g) => g.group_id as mongoose.Types.ObjectId);
      const userGroupApps = await UserGroupApplications.find({
        group_id: { $in: userGroupIds },
        is_active: true,
      }).select('app_id');
      accessibleAppIds = userGroupApps.map((a) => a.app_id as mongoose.Types.ObjectId);
    } else {
      accessibleAppIds = [];
    }
  }

  const pipeline: any[] = [];
  const matchStage: any = { is_deleted: false };

  if (accessibleAppIds) {
    if (accessibleAppIds.length === 0) {
      return {
        applications: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
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
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            created_at: 1,
            is_active: 1,
            groupCount: { $size: '$groupDetails' },
            groupNames: '$groupDetails.name',
            logCount: { $ifNull: [{ $arrayElemAt: ['$logStats.total', 0] }, 0] },
          },
        },
        { $sort: { created_at: -1 } },
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
          { $match: { is_active: true } }, // Only count active groups
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
