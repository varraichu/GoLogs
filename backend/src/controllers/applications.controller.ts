import { Response } from 'express';
import { IAuthRequest } from '../middleware/auth.middleware';
import Applications from '../models/Applications';
import UserGroupApplications from '../models/UserGroupApplications';
// import { findOrCreateUsersByEmail } from '../services/createUsers.services';
// import { getDetailedUserGroups } from '../services/userGroup.service';
import {
  CreateApplicationInput,
  UpdateApplicationInput,
  ApplicationParams,
} from '../schemas/application.validator';
import mongoose from 'mongoose';
import config from 'config';
import logger from '../config/logger';
import { getDetailedApplications } from '../services/applications.services';

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

export const getAllApplications = async (req: IAuthRequest, res: Response) => {
  try {
    const apps = await Applications.find({ is_deleted: false }).select('_id');
    const appIds = apps.map((g) => g._id as mongoose.Types.ObjectId);

    if (appIds.length === 0) {
      res.status(200).json([]);
      return;
    }

    const detailedApps = await getDetailedApplications(appIds);

    res
      .status(200)
      .json({ message: 'Applications fetched successfully', applications: detailedApps });
    return;
  } catch (error) {
    logger.error('Error fetching all user groups:', error);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

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

export const updateApplication = async (req: IAuthRequest, res: Response) => {
  try {
    const { appId } = req.params as ApplicationParams;
    console.log('Updating application with ID:', appId);
    const { name, description } = req.body as UpdateApplicationInput;

    const app = await Applications.findById(appId);
    if (!app || app.is_deleted) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    app.description = description || app.description;
    app.name = name || app.name;
    await app.save();

    const detailedApps = await getDetailedApplications([app._id as mongoose.Types.ObjectId]);
    res.status(200).json({ message: 'Application updated successfully', data: detailedApps[0] });
    return;
  } catch (error) {
    logger.error('Error updating user group:', error);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

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
