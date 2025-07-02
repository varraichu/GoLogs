import mongoose from 'mongoose';
import UserGroup from '../models/UserGroups'; // Assuming paths are correct
import UserGroupApplications from '../models/UserGroupApplications';
import UserGroups from '../models/UserGroups';

export const getDetailedUserGroups = async (groupIds: mongoose.Types.ObjectId[]) => {
  const detailedGroups = await UserGroup.aggregate([
    {
      $match: {
        _id: { $in: groupIds },
        is_deleted: false,
      },
    },

    {
      $lookup: {
        from: 'usergroupmembers', 
        localField: '_id',
        foreignField: 'group_id',
        as: 'members',
        pipeline: [
          { $match: { is_active: true } },
        ],
      },
    },

    {
      $lookup: {
        from: 'usergroupapplications',
        localField: '_id',
        foreignField: 'group_id',
        as: 'appMappings',
      },
    },

    {
      $lookup: {
        from: 'applications',
        localField: 'appMappings.app_id',
        foreignField: '_id',
        as: 'applications',
      },
    },

    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        created_at: 1,
        userCount: { $size: '$members' },
        applicationCount: { $size: '$applications' },
        applicationNames: '$applications.name',
      },
    },
  ]);

  return detailedGroups;
};


export const assignApplicationsToGroup = async (
  groupId: string,
  appIds: string[]
) => {
  const groupExists = await UserGroups.exists({ _id: groupId });
  if (!groupExists) throw new Error('Group not found');

  await UserGroupApplications.deleteMany({ group_id: groupId });

  const bulkInsert = appIds.map(appId => ({
    group_id: new mongoose.Types.ObjectId(groupId),
    app_id: new mongoose.Types.ObjectId(appId),
    user_id: null, 
  }));

  if (bulkInsert.length > 0) {
    await UserGroupApplications.insertMany(bulkInsert);
  }
};
