import mongoose from 'mongoose';
import Applications from '../models/Applications';

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
