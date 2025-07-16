import mongoose from 'mongoose';
import config from 'config';
import logger from '../config/logger';
import UserGroup from '../models/UserGroups';
import UserGroupMember from '../models/UserGroupMembers';
import UserGroupApplication from '../models/UserGroupApplications';
import User from '../models/Users';
import { findOrCreateUsersByEmail } from './createUsers.service';
import {
  getDetailedUserGroupsAggregation,
  getPaginatedUserGroupsAggregation,
  getUserGroupMembersAggregation,
} from '../aggregations/userGroup.aggregation';
import { CreateUserGroupInput, UpdateUserGroupInput } from '../schemas/userGroup.validator';

export const updateUserGroupAppAccessService = async (groupId: string, appIds: string[]) => {
  const groupExists = await UserGroup.exists({ _id: groupId });
  if (!groupExists) throw new Error('Group not found');

  await UserGroupApplication.deleteMany({ group_id: groupId });

  const bulkInsert = appIds.map((appId) => ({
    group_id: new mongoose.Types.ObjectId(groupId),
    app_id: new mongoose.Types.ObjectId(appId),
    user_id: null,
  }));

  if (bulkInsert.length > 0) {
    await UserGroupApplication.insertMany(bulkInsert);
  }
};

export const createUserGroupService = async (data: CreateUserGroupInput) => {
  const { name, description, memberEmails } = data;

  const existingGroup = await UserGroup.findOne({
    name,
    is_deleted: false,
  });

  if (existingGroup) {
    return { error: 'User group with the same name already exists' };
  }

  const newGroup = await UserGroup.create({ name, description, is_active: true });

  const usersToAdd = await findOrCreateUsersByEmail(memberEmails);

  if (usersToAdd.length > 0) {
    const memberDocs = usersToAdd.map((user) => ({ user_id: user._id, group_id: newGroup._id }));
    await UserGroupMember.insertMany(memberDocs);
  }

  const detailedGroup = await getDetailedUserGroupsAggregation([
    newGroup._id as mongoose.Types.ObjectId,
  ]);

  return { data: detailedGroup[0] };
};

export const getAllUserGroupsService = async () => {
  const groups = await UserGroup.find({ is_deleted: false }).select('_id');
  const groupIds = groups.map((g) => g._id as mongoose.Types.ObjectId);

  if (groupIds.length === 0) {
    return [];
  }

  const detailedGroups = await getDetailedUserGroupsAggregation(groupIds);
  return detailedGroups;
};

export const getAllUserGroupInfoService = async (options: {
  search: string;
  status: string;
  page: number;
  limit: number;
  appIds: string[];
}) => {
  return await getPaginatedUserGroupsAggregation(options);
};

export const getUserGroupByIdService = async (groupId: string) => {
  const detailedGroup = await getDetailedUserGroupsAggregation([
    new mongoose.Types.ObjectId(groupId),
  ]);

  if (!detailedGroup || detailedGroup.length === 0) {
    return { error: 'User group not found' };
  }

  return { data: detailedGroup[0] };
};

export const updateUserGroupService = async (
  groupId: string,
  updateData: UpdateUserGroupInput,
  userEmail?: string
) => {
  const { name, description, addMemberEmails = [], removeMemberEmails = [] } = updateData;

  const group = await UserGroup.findById(groupId);
  if (!group || group.is_deleted) {
    return { error: 'User group not found' };
  }

  const ADMIN_GROUP_NAME = config.get<string>('admin_group_name');
  const isSuperAdminGroup = group.name === ADMIN_GROUP_NAME;

  // Prevent renaming super admin group
  if (isSuperAdminGroup) {
    if (name && name !== ADMIN_GROUP_NAME) {
      return { error: `The '${ADMIN_GROUP_NAME}' group cannot be renamed.` };
    }

    if (removeMemberEmails.length > 0) {
      const flag = removeMemberEmails.filter((email) => email === userEmail);

      if (flag.length > 0) {
        return { error: 'Cannot remove yourself from Admin Group.' };
      }
    }
  }

  if (name && name !== group.name) {
    const existingGroup = await UserGroup.findOne({ name, is_deleted: false });
    if (existingGroup) {
      return { error: 'An active user group with that name already exists.' };
    }
  }

  // Update basic fields
  group.name = name || group.name;
  group.description = description || group.description;
  await group.save();

  // Add members
  if (addMemberEmails.length > 0) {
    const usersToAdd = await findOrCreateUsersByEmail(addMemberEmails);
    for (const user of usersToAdd) {
      const existing = await UserGroupMember.findOne({ user_id: user._id, group_id: group._id });
      if (existing) {
        if (!existing.is_active) {
          existing.is_active = true;
          existing.is_removed = false;
          await existing.save();
        }
      } else {
        await UserGroupMember.create({
          user_id: user._id,
          group_id: group._id,
          is_active: true,
          is_removed: false,
        });
      }
    }
  }

  // Remove members
  if (removeMemberEmails.length > 0) {
    const usersToRemove = await User.find({ email: { $in: removeMemberEmails } });
    const userIdsToRemove: mongoose.Types.ObjectId[] = usersToRemove.map(
      (u) => u._id as mongoose.Types.ObjectId
    );

    await UserGroupMember.updateMany(
      { user_id: { $in: userIdsToRemove }, group_id: group._id },
      { is_active: false, is_removed: true }
    );

    if (userIdsToRemove.length > 0) {
        await User.updateMany(
            { _id: { $in: userIdsToRemove } },
            { $set: { pinned_apps: [] } }
        );
    }
  }

  const detailedGroup = await getDetailedUserGroupsAggregation([
    group._id as mongoose.Types.ObjectId,
  ]);
  return { data: detailedGroup[0] };
};

export const deleteUserGroupService = async (groupId: string) => {
  const group = await UserGroup.findById(groupId);

  if (!group || group.is_deleted) {
    return { error: 'User group not found' };
  }

  if (group.name === config.get<string>('admin_group_name')) {
    return {
      error: `The '${config.get<string>('admin_group_name')}' group is protected and cannot be deleted.`,
    };
  }

  group.is_deleted = true;
  group.is_active = false;
  await group.save();
  await UserGroupMember.updateMany({ group_id: groupId }, { is_active: false });
  await UserGroupApplication.updateMany({ group_id: groupId }, { is_active: false });

  return { success: true };
};

export const toggleGroupStatusService = async (groupId: string, is_active: boolean) => {
  const group = await UserGroup.findById(groupId);

  if (!group || group.is_deleted || group.name === config.get('admin_group_name')) {
    return { error: 'User Group not found' };
  }

  group.is_active = is_active;
  await group.save();
  await UserGroupApplication.updateMany(
    { group_id: groupId, is_removed: false },
    { is_active: is_active }
  );
  await UserGroupMember.updateMany(
    { group_id: groupId, is_removed: false },
    { is_active: is_active }
  );

  return { message: `User group successfully set to ${is_active ? 'Active' : 'Inactive'}` };
};

export const userGroupUsersService = async (groupId: string) => {
  return await getUserGroupMembersAggregation(groupId);
};

// Legacy exports for backward compatibility
export const getDetailedUserGroups = getDetailedUserGroupsAggregation;
export const assignApplicationsToGroup = updateUserGroupAppAccessService;
export const getPaginatedUserGroups = getPaginatedUserGroupsAggregation;
