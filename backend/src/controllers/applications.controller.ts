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

interface Application {
  _id: string;
  name: string;
  description: string;
  created_at: string;
  is_active: boolean;
  groupCount: number;
  groupNames: string[];
  logCount: number;
  health_status: 'healthy' | 'warning' | 'critical';
}

export const createApplication = async (req: IAuthRequest, res: Response) => {
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
};

export const getAllApplications = async (req: IAuthRequest, res: Response) => {
  const search = req.query.search as string | undefined;
  const groupIds = (req.query.groupIds as string)?.split(',') || [];
  const status = req.query.status as 'active' | 'inactive' | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

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
};

export const getUserApplications = async (req: IAuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params as UserIdParams;

  const search = req.query.search as string | undefined;
  const status = req.query.status as 'active' | 'inactive' | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 8; // Default limit

  const { applications, pagination } = await getPaginatedFilteredApplications({
    userId,
    search,
    status,
    page,
    limit,
  });

  const user = await Users.findById(userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const pinnedAppIds = new Set(user.pinned_apps.map((id) => id.toString()));
  const applicationsWithPinStatus = applications.map((app: Application) => ({
    ...app,
    isPinned: pinnedAppIds.has(app._id.toString()),
  }));

  res.status(200).json({
    message: 'Applications fetched successfully',
    applications: applicationsWithPinStatus,
    pagination,
  });
};

export const updateApplication = async (req: IAuthRequest, res: Response) => {
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
};

export const deleteApplication = async (req: IAuthRequest, res: Response) => {
  const { appId } = req.params as ApplicationParams;
  // console.log('Deleting application with ID:', appId);
  const app = await Applications.findById(appId);

  if (!app || app.is_deleted) {
    res.status(404).json({ message: 'Application not found' });
    return;
  }

  app.is_deleted = true;
  app.is_active = false;
  await app.save();
  await UserGroupApplications.updateMany({ app_id: appId }, { is_active: false });

  res.status(204).send();
  return;
};

export const toggleApplicationStatus = async (req: IAuthRequest, res: Response) => {
  const { appId } = req.params as ApplicationParams;
  const app = await Applications.findById(appId);

  const { is_active } = req.body as applicationStatusInput;

  if (!app || app.is_deleted) {
    res.status(404).json({ message: 'Application not found' });
    return;
  }

  app.is_active = is_active;
  await app.save();
  await UserGroupApplications.updateMany(
    { app_id: appId, is_removed: false },
    { is_active: is_active }
  );

  res.status(200).json({ message: 'Application successfully set to ', is_active });
  return;
};

export const getAppCriticalLogs = async (req: IAuthRequest, res: Response) => {
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
  return;
};

export const pinApplication = async (req: IAuthRequest, res: Response): Promise<void> => {
  const { userId, appId } = req.params as { userId: string; appId: string };

  const user = await Users.findById(userId);

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const alreadyPinned = user.pinned_apps.some((id) => id.toString() === appId);

  if (alreadyPinned) {
    res.status(400).json({ message: 'Application already pinned' });
    return;
  }

  if (user.pinned_apps.length >= 3) {
    res.status(400).json({ message: 'Cannot pin more than 3 apps' });
    return;
  }

  user.pinned_apps.push(new mongoose.Types.ObjectId(appId));
  await user.save();

  res.status(200).json({ message: 'Application pinned successfully' });
  return;
};

export const unpinApplication = async (req: IAuthRequest, res: Response): Promise<void> => {
  const { userId, appId } = req.params as { userId: string; appId: string };

  const user = await Users.findById(userId);

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (!user.pinned_apps.includes(new mongoose.Types.ObjectId(appId))) {
    res.status(400).json({ message: 'Application is not pinned' });
    return;
  }

  user.pinned_apps = user.pinned_apps.filter((id) => id.toString() !== appId);
  await user.save();

  res.status(200).json({ message: 'Application unpinned successfully' });
  return;
};

export const getUserPinnedApps = async (req: IAuthRequest, res: Response): Promise<void> => {
  const userId = req.params.id;
  const user = await Users.findById(userId).select('pinned_apps');

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.status(200).json({ pinned_apps: user.pinned_apps });
  return;
};
