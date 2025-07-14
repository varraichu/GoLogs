import mongoose, { PipelineStage } from 'mongoose';
import UserGroup from '../models/UserGroups'; // Assuming paths are correct
import UserGroupApplications from '../models/UserGroupApplications';
import UserGroups from '../models/UserGroups';

/**
 * This service file abstracts complex database queries away from the controller.
 * It's responsible for aggregating detailed information about user groups.
 */

/**
 * Fetches detailed information for a given list of user group IDs.
 * It calculates the number of active users and applications for each group.
 * @param groupIds - An array of mongoose.Types.ObjectId for the groups to fetch.
 * @returns A promise that resolves to an array of detailed user group objects.
 */
export const getDetailedUserGroups = async (groupIds: mongoose.Types.ObjectId[]) => {
  const detailedGroups = await UserGroup.aggregate([
    {
      $match: {
        _id: { $in: groupIds },
        is_deleted: false,
      },
    },
    // 2. Lookup active members from the UserGroupMembers collection (this part is correct)
    {
      $lookup: {
        from: 'usergroupmembers',
        localField: '_id',
        foreignField: 'group_id',
        as: 'members',
        pipeline: [{ $match: { is_active: true, is_removed: false } }],
      },
    },
    // 3. Perform a multi-stage lookup to get application names
    {
      $lookup: {
        from: 'usergroupapplications', // FIX: Corrected collection name typo
        localField: '_id',
        foreignField: 'group_id',
        as: 'assignedApplications',
        // This pipeline will run on the 'usergroupapplications' collection
        pipeline: [
          // {
          //   $match: {
          //     is_active: true,
          //     is_removed: false,
          //   },
          // },
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
              _id: 0, // Exclude the id of the link table
              name: { $arrayElemAt: ['$applicationDetails.name', 0] },
            },
          },
        ],
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
        userCount: { $size: '$members' },
        // FIX: Use the result of our new lookup
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
  ]);

  return detailedGroups;
};

export const assignApplicationsToGroup = async (groupId: string, appIds: string[]) => {
  const groupExists = await UserGroups.exists({ _id: groupId });
  if (!groupExists) throw new Error('Group not found');

  await UserGroupApplications.deleteMany({ group_id: groupId });

  const bulkInsert = appIds.map((appId) => ({
    group_id: new mongoose.Types.ObjectId(groupId),
    app_id: new mongoose.Types.ObjectId(appId),
    user_id: null,
  }));

  if (bulkInsert.length > 0) {
    await UserGroupApplications.insertMany(bulkInsert);
  }
};

export const getPaginatedUserGroups = async (options: {
  search: string;
  status: string;
  page: number;
  limit: number;
  appIds: string[]; // Add appIds to options type
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

  // New logic to filter by application IDs
  if (appIds && appIds.length > 0) {
    // Convert string IDs to Mongoose ObjectIds for matching
    const appObjectIds = appIds.map(id => new mongoose.Types.ObjectId(id));
    matchStage['assignedApplications.app_id'] = { $in: appObjectIds };
  }

  // We need to perform the application lookup BEFORE the main $match stage
  // if we want to filter by application.
  const aggregationPipeline: PipelineStage[] = [
    // 1. Lookup applications first
    {
      $lookup: {
        from: 'usergroupapplications',
        localField: '_id',
        foreignField: 'group_id',
        as: 'assignedApplications'
      }
    },
    // 2. Apply all filters (including the new app filter)
    { $match: matchStage },
    // 3. Facet for pagination and detailed lookups
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
          // The application lookup is already done, but we need to refine it to get names
          {
            $lookup: {
              from: 'usergroupapplications',
              localField: '_id',
              foreignField: 'group_id',
              as: 'applicationsWithName', // Use a different name to avoid conflicts
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

  const results = await UserGroup.aggregate(aggregationPipeline);

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
