import { Response } from 'express';
import { IAuthRequest } from '../middleware/auth.middleware';
import UserGroup from '../models/UserGroups';
import UserGroupMember from '../models/UserGroupMembers';
import UserGroupApplication from '../models/UserGroupApplications';
import User from '../models/Users';
import { findOrCreateUsersByEmail } from '../services/createUsers.services';
import { getDetailedUserGroups } from '../services/userGroup.service';
import {
  CreateUserGroupInput,
  UpdateUserGroupInput,
  UserGroupParams,
} from '../schemas/userGroup.validator';
import mongoose from 'mongoose';
import config from 'config';
import logger from '../config/logger';

export const createUserGroup = async (req: IAuthRequest, res: Response) => {
  try {
    const { name, description, memberEmails } = req.body as CreateUserGroupInput;

    const newGroup = await UserGroup.create({ name, description });

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
      res.status(400).json({ message: 'An active user group with this name already exists.' });
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
            await existing.save();
          }
        } else {
          await UserGroupMember.create({
            user_id: user._id,
            group_id: group._id,
            is_active: true,
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
        { is_active: false }
      );
    }

    // Return detailed group info
    const detailedGroup = await getDetailedUserGroups([group._id as mongoose.Types.ObjectId]);
    res.status(200).json(detailedGroup[0]);
    return;
  } catch (error) {
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
