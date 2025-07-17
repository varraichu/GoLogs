// import mongoose from 'mongoose';
import Applications from '../models/Applications';
import UserGroupApplications from '../models/UserGroupApplications';
import UserGroupMembers from '../models/UserGroupMembers';
import UserGroups from '../models/UserGroups';
import Logs from '../models/Logs';
import { IUserGroupMember } from '../models/UserGroupMembers';

/**
 * Assigns an application to multiple user groups by upserting active assignment records.
 * @param appId - The ID of the application to assign.
 * @param groupIds - The list of user group IDs to assign the application to.
 * @returns Promise<void>
 */
export const assignAppToGroups = async (appId: string, groupIds: string[]) => {
  // Validate: appId format
  const appExists = await Applications.exists({ _id: appId, is_deleted: false });
  if (!appExists) {
    throw { status: 404, message: `Application with ID ${appId} not found` };
  }

  const existingGroupCount = await UserGroups.countDocuments({
    _id: { $in: groupIds },
    is_deleted: false,
  });
  if (existingGroupCount !== groupIds.length) {
    throw { status: 404, message: 'One or more user groups not found' };
  }

  // For each group, upsert the UserGroupApplications document
  const bulkOps = groupIds.map((groupId) => ({
    updateOne: {
      filter: {
        app_id: appId,
        group_id: groupId,
      },
      update: {
        $set: { is_active: true, is_removed: false },
        $setOnInsert: {
          app_id: appId,
          group_id: groupId,
        },
      },
      upsert: true,
    },
  }));

  if (bulkOps.length > 0) {
    await UserGroupApplications.bulkWrite(bulkOps);
  }
};

/**
 * Unassigns an application from a specific user group by marking the assignment as inactive and removed.
 * @param appId - The ID of the application to unassign.
 * @param groupId - The ID of the user group to unassign the application from.
 * @returns Promise<void>
 */
export const unassignAppFromGroup = async (appId: string, groupId: string) => {
  const appExists = await Applications.exists({ _id: appId, is_deleted: false });
  if (!appExists) {
    throw { status: 404, message: `Application with ID ${appId} not found` };
  }
  const groupExists = await UserGroups.exists({ _id: groupId, is_deleted: false });
  if (!groupExists) {
    throw { status: 404, message: `UserGroup with ID ${groupId} not found` };
  }

  const result = await UserGroupApplications.updateMany(
    { app_id: appId, group_id: groupId, is_active: true },
    { $set: { is_active: false, is_removed: true } }
  );

  if (result.modifiedCount === 0) {
    throw { status: 404, message: 'No assignment found for given appId and groupId' };
  }
};

/**
 * Retrieves the list of user group IDs to which a given application is currently assigned.
 * @param appId - The ID of the application to query.
 * @returns Promise<string[]> - A list of group IDs the application is actively assigned to.
 */
export const getAppAssignedGroups = async (appId: string) => {
  const appExists = await Applications.exists({ _id: appId, is_deleted: false });
  if (!appExists) {
    throw { status: 404, message: `Application with ID ${appId} not found` };
  }

  return await UserGroupApplications.find({
    app_id: appId,
    is_active: true,
    is_removed: false,
  }).distinct('group_id');
};
