import mongoose from 'mongoose';
import UserGroup from '../models/UserGroups'; // Assuming paths are correct

export const getDetailedUserGroups = async (groupIds: mongoose.Types.ObjectId[]) => {
  const detailedGroups = await UserGroup.aggregate([
    // 1. Filter for the requested, non-deleted groups
    {
      $match: {
        _id: { $in: groupIds },
        is_deleted: false,
      },
    },
    // 2. Lookup active members from the UserGroupMembers collection
    {
      $lookup: {
        from: 'usergroupmembers', // The actual collection name in MongoDB (usually plural and lowercase)
        localField: '_id',
        foreignField: 'group_id',
        as: 'members',
        pipeline: [
          { $match: { is_active: true } }, // Only count active members
        ],
      },
    },
    // 3. Placeholder for application lookup.
    // In a real scenario, you would have a similar $lookup stage here:
    // {
    //   $lookup: {
    //     from: 'applicationassignments',
    //     localField: '_id',
    //     foreignField: 'group_id',
    //     as: 'applications',
    //   }
    // },

    // 4. Project the final shape of the output
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        created_at: 1,
        userCount: { $size: '$members' },
        // Placeholder values for applications
        applicationCount: { $const: 0 }, // Replace with { $size: '$applications' }
        applicationNames: { $const: [] }, // Replace with '$applications.name'
      },
    },
  ]);

  return detailedGroups;
};
