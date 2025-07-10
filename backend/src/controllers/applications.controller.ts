import { Response } from 'express';
import { IAuthRequest } from '../middleware/auth.middleware';
import Applications from '../models/Applications';
import UserGroupApplications from '../models/UserGroupApplications';
import UserGroupMembers from '../models/UserGroupMembers';
import {
  CreateApplicationInput,
  UpdateApplicationInput,
  ApplicationParams,
  applicationStatusInput,
  UserIdParams,
} from '../schemas/application.validator';
import mongoose from 'mongoose';
import config from 'config';
import logger from '../config/logger';
import { getDetailedApplications } from '../services/applications.service';
import Logs from '../models/Logs';
import Users from '../models/Users';
import { getPaginatedFilteredApplications } from '../services/applications.service';

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
    // Extract query parameters for filtering, searching, and pagination
    const search = req.query.search as string | undefined;
    const groupIds = (req.query.groupIds as string)?.split(',') || [];
    const status = req.query.status as 'active' | 'inactive' | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Pass parameters to the new service function
    const { applications, pagination } = await getPaginatedFilteredApplications({
      search,
      groupIds,
      status,
      page,
      limit,
    });

    res.status(200).json({
      message: 'Applications fetched successfully',
      applications,
      pagination,
    });
  } catch (error) {
    logger.error('Error fetching all applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserApplications = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params as UserIdParams;
    // console.log('Fetching applications for user ID:', userId);
    const userGroups = await UserGroupMembers.find({
      user_id: userId,
      is_active: true,
    }).select('group_id');

    const groupIds = userGroups.map((g) => g.group_id as mongoose.Types.ObjectId);

    if (groupIds.length === 0) {
      res.status(404).json({ message: 'No user groups found', applications: [] });
      return;
    }

    const userGroupApps = await UserGroupApplications.find({
      group_id: { $in: groupIds },
      is_active: true,
    }).select('app_id');

    const appIds = userGroupApps.map((g) => g.app_id as mongoose.Types.ObjectId);

    if (appIds.length === 0) {
      res.status(404).json({ message: 'No applications found', applications: [] });
      return;
    }

    const detailedApps = await getDetailedApplications(appIds);

    const user = await Users.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found', applications: [] });
      return;
    }

    // Add isPinned status to each application
    const applicationsWithPinStatus = detailedApps.map((app) => ({
      ...app,
      isPinned: user.pinned_apps.includes(app._id),
    }));

    res.status(200).json({
      message: 'Applications fetched successfully',
      applications: applicationsWithPinStatus,
    });
  } catch (error) {
    logger.error('Error fetching all user groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateApplication = async (req: IAuthRequest, res: Response) => {
  try {
    const { appId } = req.params as ApplicationParams;
    // console.log('Updating application with ID:', appId);
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

export const getAppCriticalLogs = async (req: IAuthRequest, res: Response) => {
  try {
    const { appId } = req.params as ApplicationParams;

    const logStats = await Logs.aggregate([
      { $match: { app_id: new mongoose.Types.ObjectId(appId) } },
      {
        $group: {
          _id: '$log_type',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalLogs = logStats.reduce((sum, log) => sum + log.count, 0); // Sum of all logs

    const criticalLogs = {
      totalLogs: totalLogs,
      // infoLogs: logStats.find(log => log._id === 'info')?.count || 0,
      errorLogs: logStats.find((log) => log._id === 'error')?.count || 0,
      warningLogs: logStats.find((log) => log._id === 'warn')?.count || 0,
    };

    res.status(200).json(criticalLogs);
  } catch (error) {
    logger.error('Error fetching critical log data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const pinApplication = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, appId } = req.params as { userId: string; appId: string };

    const user = await Users.findById(userId);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return; // Early return on error
    }

    if (user.pinned_apps.length >= 3) {
      res.status(400).json({ message: 'Cannot pin more than 3 apps' });
      return; // Early return if user has too many pinned apps
    }

    if (user.pinned_apps.includes(new mongoose.Types.ObjectId(appId))) {
      res.status(400).json({ message: 'Application already pinned' });
      return; // Early return if the app is already pinned
    }

    user.pinned_apps.push(new mongoose.Types.ObjectId(appId));
    await user.save();

    res.status(200).json({ message: 'Application pinned successfully' });
  } catch (error) {
    logger.error('Error pinning application:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const unpinApplication = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, appId } = req.params as { userId: string; appId: string };

    const user = await Users.findById(userId);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return; // Early return on error
    }

    if (!user.pinned_apps.includes(new mongoose.Types.ObjectId(appId))) {
      res.status(400).json({ message: 'Application is not pinned' });
      return; // Early return if the app is not pinned
    }

    user.pinned_apps = user.pinned_apps.filter((id) => id.toString() !== appId);
    await user.save();

    res.status(200).json({ message: 'Application unpinned successfully' });
  } catch (error) {
    logger.error('Error unpinning application:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
