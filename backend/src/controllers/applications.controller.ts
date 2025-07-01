import { Response } from 'express';
import { IAuthRequest } from '../middleware/auth.middleware';
import Applications from '../models/Applications';
import UserGroupApplications from '../models/UserGroupApplications';
// import { findOrCreateUsersByEmail } from '../services/createUsers.services';
// import { getDetailedUserGroups } from '../services/userGroup.service';
import { CreateApplicationInput, ApplicationParams } from '../schemas/application.validator';
import mongoose from 'mongoose';
import config from 'config';
import logger from '../config/logger';

export const createApplication = async (req: IAuthRequest, res: Response) => {
  try {
    const { name, description } = req.body as CreateApplicationInput;

    const newApp = await Applications.create({
      name,
      description,
      is_deleted: false,
      created_at: new Date(),
    });

    // const usersToAdd = await findOrCreateUsersByEmail(memberEmails);

    // if (usersToAdd.length > 0) {
    //   const memberDocs = usersToAdd.map((user) => ({ user_id: user._id, group_id: newGroup._id }));
    //   await UserGroupMember.insertMany(memberDocs);
    // }

    // const detailedGroup = await getDetailedUserGroups([newGroup._id as mongoose.Types.ObjectId]);

    res.status(201).json({ message: 'Application created successfully', application: newApp });
    return;
  } catch (error: any) {
    logger.error('Error creating application:', error);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

// export const getAllUserGroups = async (req: IAuthRequest, res: Response) => {
//   try {
//     const groups = await UserGroup.find({ is_deleted: false }).select('_id');
//     const groupIds = groups.map((g) => g._id as mongoose.Types.ObjectId);

//     if (groupIds.length === 0) {
//       res.status(200).json([]);
//       return;
//     }

//     const detailedGroups = await getDetailedUserGroups(groupIds);

//     res.status(200).json(detailedGroups);
//     return;
//   } catch (error) {
//     logger.error('Error fetching all user groups:', error);
//     res.status(500).json({ message: 'Server error' });
//     return;
//   }
// };

// export const getUserGroupById = async (req: IAuthRequest, res: Response) => {
//   try {
//     const { groupId } = req.params as UserGroupParams;
//     const detailedGroup = await getDetailedUserGroups([new mongoose.Types.ObjectId(groupId)]);

//     if (!detailedGroup || detailedGroup.length === 0) {
//       res.status(404).json({ message: 'User group not found' });
//       return;
//     }

//     res.status(200).json(detailedGroup[0]);
//     return;
//   } catch (error) {
//     logger.error('Error fetching user group by ID:', error);
//     res.status(500).json({ message: 'Server error' });
//     return;
//   }
// };

// export const updateUserGroup = async (req: IAuthRequest, res: Response) => {
//   try {
//     const { groupId } = req.params as UserGroupParams;
//     const { name, description, addMemberEmails, removeMemberEmails } =
//       req.body as UpdateUserGroupInput;

//     const group = await UserGroup.findById(groupId);
//     if (!group || group.is_deleted) {
//       res.status(404).json({ message: 'User group not found' });
//       return;
//     }

//     const isSuperAdminGroup = group.name === config.get<string>('admin_group_name');

//     if (isSuperAdminGroup && name && name !== config.get<string>('admin_group_name')) {
//       res.status(403).json({
//         message: `The '${config.get<string>('admin_group_name')}' group cannot be renamed.`,
//       });
//       return;
//     }

//     group.description = description || group.description;
//     group.name = name || group.name;
//     await group.save();

//     if (addMemberEmails && addMemberEmails.length > 0) {
//       const usersToAdd = await findOrCreateUsersByEmail(addMemberEmails);

//       if (usersToAdd.length > 0) {
//         const memberDocs = usersToAdd.map((user) => ({ user_id: user._id, group_id: group._id }));
//         await UserGroupMember.insertMany(memberDocs);
//       }
//     }

//     if (removeMemberEmails && removeMemberEmails.length > 0) {
//       const usersToRemove = await User.find({ email: { $in: removeMemberEmails } });
//       const userIdsToRemove = usersToRemove.map((u) => u._id);
//       await UserGroupMember.updateMany(
//         { user_id: { $in: userIdsToRemove }, group_id: group._id },
//         { is_active: false }
//       );
//     }

//     const detailedGroup = await getDetailedUserGroups([group._id as mongoose.Types.ObjectId]);
//     res.status(200).json(detailedGroup[0]);
//     return;
//   } catch (error) {
//     logger.error('Error updating user group:', error);
//     res.status(500).json({ message: 'Server error' });
//     return;
//   }
// };

export const deleteApplication = async (req: IAuthRequest, res: Response) => {
  try {
    const { appId } = req.params as ApplicationParams;
    // console.log('Deleting application with ID:', appId);
    const app = await Applications.findById(appId);

    if (!app || app.is_deleted) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    app.is_deleted = true;
    await app.save();
    await UserGroupApplications.updateMany({ app_id: appId }, { is_active: false });

    res.status(204).send();
    return;
  } catch (error) {
    logger.error('Error deleting application:', error);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};
