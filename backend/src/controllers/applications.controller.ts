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
  applicationStatusInput,
} from '../schemas/application.validator';
import mongoose from 'mongoose';
import config from 'config';
import logger from '../config/logger';
import { getDetailedApplications } from '../services/applications.services';

export const createApplication = async (req: IAuthRequest, res: Response) => {
  try {
    const { name, description } = req.body as CreateApplicationInput;

    const existingApp = await Applications.findOne({
      name,
      is_deleted: false,
    });
    if (existingApp) {
      res.status(400).json({ message: 'Application with the same name already exists' });
      return;
    }

    const newApp = await Applications.create({
      name,
      description,
      is_deleted: false,
      is_active: true,
      created_at: new Date(),
    });

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
    res
      .status(200)
      .json({ message: 'Application updated successfully', applications: detailedApps[0] });
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

export const toggleApplicationStatus = async (req: IAuthRequest, res: Response) => {
  try {
    const { appId } = req.params as ApplicationParams;
    const app = await Applications.findById(appId);

    const { is_active } = req.body as applicationStatusInput;

    if (!app || app.is_deleted) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    app.is_active = is_active;
    await app.save();
    await UserGroupApplications.updateMany({ app_id: appId }, { is_active: is_active });

    res.status(200).json({ message: 'Application successfully set to ', is_active });
    return;
  } catch (error) {
    logger.error('Error toggling application status:', error);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};
