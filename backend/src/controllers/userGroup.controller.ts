import { Response } from 'express';
import { IAuthRequest } from '../middleware/auth.middleware';
import UserGroup from '../models/UserGroups';
import UserGroupMember from '../models/UserGroupMembers';
import UserGroupApplication from '../models/UserGroupApplications';
import User from '../models/Users';
import { findOrCreateUsersByEmail } from '../services/createUsers.service';
import { getDetailedUserGroups, getPaginatedUserGroups } from '../services/userGroup.service';
import {
  CreateUserGroupInput,
  UpdateUserGroupInput,
  UserGroupParams,
  userGroupStatusInput,
} from '../schemas/userGroup.validator';
import mongoose from 'mongoose';
import config from 'config';
import logger from '../config/logger';

import { Request } from 'express';
import { assignApplicationsToGroup } from '../services/userGroup.service';
import UserGroupApplications from '../models/UserGroupApplications';

export const updateUserGroupAppAccess = async (req: Request, res: Response): Promise<void> => {
  const { groupId } = req.params;
  const { appIds } = req.body;

  if (!Array.isArray(appIds)) {
    res.status(400).json({ message: 'appIds must be an array' });
    return;
  }

  try {
    await assignApplicationsToGroup(groupId, appIds);
    res.status(200).json({ message: 'Application access updated 🚀 ' });
  } catch (error) {
    console.error('Error updating app access:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createUserGroup = async (req: IAuthRequest, res: Response) => {
  try {
    const { name, description, memberEmails } = req.body as CreateUserGroupInput;

    const existingGroup = await UserGroup.findOne({
      name,
      is_deleted: false,
    });
    if (existingGroup) {
      res.status(400).json({ message: 'User group with the same name already exists' });
      return;
    }

    const newGroup = await UserGroup.create({ name, description, is_active: true });

    const usersToAdd = await findOrCreateUsersByEmail(memberEmails);

    if (usersToAdd.length > 0) {
      const memberDocs = usersToAdd.map((user) => ({ user_id: user._id, group_id: newGroup._id }));
      await UserGroupMember.insertMany(memberDocs);
    }

    const detailedGroup = await getDetailedUserGroups([newGroup._id as mongoose.Types.ObjectId]);

    res.status(201).json(detailedGroup[0]);
    return;
  } catch (error: any) {
    if (error.code === 11000 && error.keyPattern?.name) {
      res.status(400).json({ message: 'An active user group with name already exists.' });
      return;
    }
    logger.error('Error creating user group:', error);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const getAllUserGroups = async (req: IAuthRequest, res: Response) => {
  try {
    const groups = await UserGroup.find({ is_deleted: false }).select('_id');
    const groupIds = groups.map((g) => g._id as mongoose.Types.ObjectId);

    if (groupIds.length === 0) {
      res.status(200).json([]);
      return;
    }

    const detailedGroups = await getDetailedUserGroups(groupIds);

    res.status(200).json(detailedGroups);
    return;
  } catch (error) {
    logger.error('Error fetching all user groups:', error);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const getAllUserGroupInfo = async (req: IAuthRequest, res: Response) => {
  try {
    const { search = '', status = 'all', page = '1', limit = '6', appIds = '' } = req.query;

    const options = {
      search: search as string,
      status: status as string,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      appIds: (appIds as string) ? (appIds as string).split(',') : [],
    };

    const result = await getPaginatedUserGroups(options);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error fetching all user groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserGroupById = async (req: IAuthRequest, res: Response) => {
  try {
    const { groupId } = req.params as UserGroupParams;
    const detailedGroup = await getDetailedUserGroups([new mongoose.Types.ObjectId(groupId)]);

    if (!detailedGroup || detailedGroup.length === 0) {
      res.status(404).json({ message: 'User group not found' });
      return;
    }

    res.status(200).json(detailedGroup[0]);
    return;
  } catch (error) {
    logger.error('Error fetching user group by ID:', error);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const updateUserGroup = async (req: IAuthRequest, res: Response) => {
  try {
    const { groupId } = req.params as UserGroupParams;
    const {
      name,
      description,
      addMemberEmails = [],
      removeMemberEmails = [],
    } = req.body as UpdateUserGroupInput;

    const group = await UserGroup.findById(groupId);
    if (!group || group.is_deleted) {
      res.status(404).json({ message: 'User group not found' });
      return;
    }

    const ADMIN_GROUP_NAME = config.get<string>('admin_group_name');
    const isSuperAdminGroup = group.name === ADMIN_GROUP_NAME;

    // Prevent renaming super admin group
    if (isSuperAdminGroup && name && name !== ADMIN_GROUP_NAME) {
      res.status(403).json({ message: `The '${ADMIN_GROUP_NAME}' group cannot be renamed.` });
      return;
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
      const userIdsToRemove = usersToRemove.map((u) => u._id);
      await UserGroupMember.updateMany(
        { user_id: { $in: userIdsToRemove }, group_id: group._id },
        { is_active: false, is_removed: true }
      );
    }

    // Return detailed group info
    const detailedGroup = await getDetailedUserGroups([group._id as mongoose.Types.ObjectId]);
    res.status(200).json(detailedGroup[0]);
    return;
  } catch (error: any) {
    if (error.code === 11000 && error.keyPattern?.name) {
      res.status(400).json({ message: 'An active user group with name already exists.' });
      return;
    }
    logger.error('Error updating user group:', error);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const deleteUserGroup = async (req: IAuthRequest, res: Response) => {
  try {
    const { groupId } = req.params as UserGroupParams;
    const group = await UserGroup.findById(groupId);

    if (!group || group.is_deleted) {
      res.status(404).json({ message: 'User group not found' });
      return;
    }

    if (group.name === config.get<string>('admin_group_name')) {
      res.status(403).json({
        message: `The '${config.get<string>('admin_group_name')}' group is protected and cannot be deleted.`,
      });
      return;
    }

    group.is_deleted = true;
    group.is_active = false;
    await group.save();
    await UserGroupMember.updateMany({ group_id: groupId }, { is_active: false });
    await UserGroupApplication.updateMany({ group_id: groupId }, { is_active: false });

    res.status(204).send();
    return;
  } catch (error) {
    logger.error('Error deleting user group:', error);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const toggleGroupStatus = async (req: IAuthRequest, res: Response) => {
  try {
    const { groupId } = req.params as UserGroupParams;
    const group = await UserGroup.findById(groupId);

    const { is_active } = req.body as userGroupStatusInput;

    if (!group || group.is_deleted || group.name === config.get('admin_group_name')) {
      res.status(404).json({ message: 'User Group not found' });
      return;
    }

    group.is_active = is_active;
    await group.save();
    await UserGroupApplications.updateMany(
      { group_id: groupId, is_removed: false },
      { is_active: is_active }
    );
    await UserGroupMember.updateMany(
      { group_id: groupId, is_removed: false },
      { is_active: is_active }
    );

    res
      .status(200)
      .json({ message: `User group successfully set to ${is_active ? 'Active' : 'Inactive'}` });
    return;
  } catch (error) {
    logger.error('Error toggling application status:', error);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};
