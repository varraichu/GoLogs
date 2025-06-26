import mongoose from 'mongoose';
import UserGroupApplications from '../models/UserGroupApplications';
import Applications from '../models/Applications';
import UserGroups from '../models/UserGroups';

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
