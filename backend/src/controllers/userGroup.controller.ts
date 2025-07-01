import { Request, Response } from 'express';
import { IAuthRequest } from '../middleware/auth.middleware';
import UserGroup from '../models/UserGroups';
import UserGroupMember from '../models/UserGroupMembers';
import User from '../models/Users';
import { findOrCreateUsersByEmail } from '../services/createUsers.services';
import {
  assignApplicationsToGroup,
  getDetailedUserGroups,
} from '../services/userGroup.service';
import {
  CreateUserGroupInput,
  UpdateUserGroupInput,
  UserGroupParams,
} from '../schemas/userGroup.validator';
import mongoose from 'mongoose';
import config from 'config';

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

    const newGroup = await UserGroup.create({ name, description });

    const usersToAdd = await findOrCreateUsersByEmail(memberEmails);

    if (usersToAdd.length > 0) {
      const memberDocs = usersToAdd.map((user) => ({ user_id: user._id, group_id: newGroup._id }));
      await UserGroupMember.insertMany(memberDocs);
    }

    const detailedGroup = await getDetailedUserGroups([newGroup._id as mongoose.Types.ObjectId]);

    res.status(201).json(detailedGroup[0]);
  } catch (error: any) {
    console.error('Error creating user group:', error);
    res.status(500).json({ message: 'Server error' });
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
  } catch (error) {
    console.error('Error fetching all user groups:', error);
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
  } catch (error) {
    console.error('Error fetching user group by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserGroup = async (req: IAuthRequest, res: Response) => {
  try {
    const { groupId } = req.params as UserGroupParams;
    const { name, description, addMemberEmails, removeMemberEmails } =
      req.body as UpdateUserGroupInput;

    const group = await UserGroup.findById(groupId);
    if (!group || group.is_deleted) {
      res.status(404).json({ message: 'User group not found' });
      return;
    }

    const isSuperAdminGroup = group.name === config.get<string>('admin_group_name');

    if (isSuperAdminGroup && name && name !== config.get<string>('admin_group_name')) {
      res.status(403).json({
        message: `The '${config.get<string>('admin_group_name')}' group cannot be renamed.`,
      });
      return;
    }

    group.description = description || group.description;
    await group.save();

    if (addMemberEmails && addMemberEmails.length > 0) {
      const usersToAdd = await findOrCreateUsersByEmail(addMemberEmails);

      if (usersToAdd.length > 0) {
        const memberDocs = usersToAdd.map((user) => ({ user_id: user._id, group_id: group._id }));
        await UserGroupMember.insertMany(memberDocs);
      }
    }

    if (removeMemberEmails && removeMemberEmails.length > 0) {
      const usersToRemove = await User.find({ email: { $in: removeMemberEmails } });
      const userIdsToRemove = usersToRemove.map((u) => u._id);
      await UserGroupMember.updateMany(
        { user_id: { $in: userIdsToRemove }, group_id: group._id },
        { is_active: false }
      );
    }

    const detailedGroup = await getDetailedUserGroups([group._id as mongoose.Types.ObjectId]);
    res.status(200).json(detailedGroup[0]);
  } catch (error) {
    console.error('Error updating user group:', error);
    res.status(500).json({ message: 'Server error' });
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

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user group:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
