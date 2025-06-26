import mongoose from 'mongoose';
import UserGroupApplications from '../models/UserGroupApplications';
import Applications from '../models/Applications';
import UserGroups from '../models/UserGroups';

// Overwrites existing app access for a group
export const assignApplicationsToGroup = async (
  groupId: string,
  appIds: string[]
) => {
  const groupExists = await UserGroups.exists({ _id: groupId });
  if (!groupExists) throw new Error('Group not found');

  // Remove previous app access
  await UserGroupApplications.deleteMany({ group_id: groupId });

  // Create new mappings
  const bulkInsert = appIds.map(appId => ({
    group_id: new mongoose.Types.ObjectId(groupId),
    app_id: new mongoose.Types.ObjectId(appId),
    user_id: null, // Optional: can be populated if needed
  }));

  if (bulkInsert.length > 0) {
    await UserGroupApplications.insertMany(bulkInsert);
  }
};
