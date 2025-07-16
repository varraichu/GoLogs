import mongoose, { PipelineStage } from 'mongoose';
import UserGroup from '../models/UserGroups';
import UserGroupMember from '../models/UserGroupMembers';

/**
 * Aggregation functions for User Groups
 * This file contains all MongoDB aggregation pipelines for user group operations
 */

/**
 * Fetches detailed information for a given list of user group IDs.
 * It calculates the number of active users and applications for each group.
 */
export const getDetailedUserGroupsAggregation = async (groupIds: mongoose.Types.ObjectId[]) => {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        _id: { $in: groupIds },
        is_deleted: false,
      },
    },
    // Lookup active members from the UserGroupMembers collection
    {
      $lookup: {
        from: 'usergroupmembers',
        localField: '_id',
        foreignField: 'group_id',
        as: 'members',
        pipeline: [{ $match: { is_active: true, is_removed: false } }],
      },
    },
    // Perform a multi-stage lookup to get application names
    {
      $lookup: {
        from: 'usergroupapplications',
        localField: '_id',
        foreignField: 'group_id',
        as: 'assignedApplications',
        pipeline: [
          // First, join with the 'applications' collection to get details
          {
            $lookup: {
              from: 'applications',
              localField: 'app_id',
              foreignField: '_id',
              as: 'applicationDetails',
            },
          },
          // We only want active applications
          {
            $match: {
              'applicationDetails.is_active': true,
              'applicationDetails.is_deleted': false,
            },
          },
          // Reshape the document to only include the application name
          {
            $project: {
              _id: 0,
              name: { $arrayElemAt: ['$applicationDetails.name', 0] },
            },
          },
        ],
      },
    },
    // Project the final shape of the output
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        created_at: 1,
        is_active: 1,
        userCount: { $size: '$members' },
        applicationCount: {
          $cond: {
            if: { $eq: ['$is_active', true] },
            then: { $size: '$assignedApplications' },
            else: 0,
          },
        },
        applicationNames: {
          $cond: {
            if: { $eq: ['$is_active', true] },
            then: '$assignedApplications.name',
            else: [],
          },
        },
      },
    },
  ];

  return await UserGroup.aggregate(pipeline);
};

/**
 * Gets paginated user groups with search, status, and application filtering
 */
export const getPaginatedUserGroupsAggregation = async (options: {
  search: string;
  status: string;
  page: number;
  limit: number;
  appIds: string[];
}) => {
  const { search, status, page, limit, appIds } = options;
  const skip = (page - 1) * limit;

  const matchStage: any = { is_deleted: false };

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    matchStage.$or = [{ name: searchRegex }, { description: searchRegex }];
  }

  if (status === 'active') {
    matchStage.is_active = true;
  } else if (status === 'inactive') {
    matchStage.is_active = false;
  }

  // Filter by application IDs if provided
  if (appIds && appIds.length > 0) {
    const appObjectIds = appIds.map((id) => new mongoose.Types.ObjectId(id));
    matchStage['assignedApplications.app_id'] = { $in: appObjectIds };
  }

  const pipeline: PipelineStage[] = [
    // Lookup applications first for filtering
    {
      $lookup: {
        from: 'usergroupapplications',
        localField: '_id',
        foreignField: 'group_id',
        as: 'assignedApplications',
      },
    },
    // Apply all filters (including the app filter)
    { $match: matchStage },
    // Facet for pagination and detailed lookups
    {
      $facet: {
        paginatedResults: [
          { $sort: { created_at: 1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'usergroupmembers',
              localField: '_id',
              foreignField: 'group_id',
              as: 'members',
              pipeline: [{ $match: { is_active: true } }],
            },
          },
          // Get application names for the results
          {
            $lookup: {
              from: 'usergroupapplications',
              localField: '_id',
              foreignField: 'group_id',
              as: 'applicationsWithName',
              pipeline: [
                {
                  $lookup: {
                    from: 'applications',
                    localField: 'app_id',
                    foreignField: '_id',
                    as: 'applicationDetails',
                  },
                },
                {
                  $match: {
                    'applicationDetails.is_active': true,
                    'applicationDetails.is_deleted': false,
                  },
                },
                {
                  $project: {
                    _id: 0,
                    name: { $arrayElemAt: ['$applicationDetails.name', 0] },
                  },
                },
              ],
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              description: 1,
              created_at: 1,
              is_active: 1,
              userCount: { $size: '$members' },
              applicationCount: {
                $cond: {
                  if: { $eq: ['$is_active', true] },
                  then: { $size: '$applicationsWithName' },
                  else: 0,
                },
              },
              applicationNames: {
                $cond: {
                  if: { $eq: ['$is_active', true] },
                  then: '$applicationsWithName.name',
                  else: [],
                },
              },
            },
          },
        ],
        totalCount: [{ $count: 'total' }],
      },
    },
  ];

  const results = await UserGroup.aggregate(pipeline);

  if (!results[0] || results[0].paginatedResults.length === 0) {
    return {
      groups: [],
      pagination: { total: 0, page, limit, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    };
  }

  const groups = results[0].paginatedResults;
  const totalGroups = results[0].totalCount.length > 0 ? results[0].totalCount[0].total : 0;
  const totalPages = Math.ceil(totalGroups / limit);

  return {
    groups,
    pagination: {
      total: totalGroups,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Gets users belonging to a specific user group
 */
export const getUserGroupMembersAggregation = async (groupId: string) => {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        group_id: new mongoose.Types.ObjectId(groupId),
        is_active: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user',
        pipeline: [
          {
            $project: {
              email: 1,
              username: 1,
              picture_url: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        _id: 0,
        user: { $arrayElemAt: ['$user', 0] },
      },
    },
    {
      $replaceRoot: { newRoot: '$user' },
    },
  ];

  return await UserGroupMember.aggregate(pipeline);
};
