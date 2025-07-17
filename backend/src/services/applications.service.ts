import mongoose from 'mongoose';
import Applications from '../models/Applications';
import UserGroupApplications from '../models/UserGroupApplications';
import UserGroupMembers from '../models/UserGroupMembers';
import Users from '../models/Users';
import Settings from '../models/Settings';
import UserGroup from '../models/UserGroups';
import {
  getPaginatedFilteredApplicationsPipeline,
  getDetailedApplicationsPipeline,
  getAppCriticalLogsPipeline,
} from '../aggregations/applications.aggregation';
import Logs from '../models/Logs';
import config from 'config';

export interface Application {
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

interface FilterOptions {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'inactive';
  groupIds?: string[];
  userId?: string;
}

export const createApplicationService = async (name: string, description: string) => {
  const existingApp = await Applications.findOne({
    name,
    is_deleted: false,
  });

  if (existingApp) {
    return {
      success: false,
      message: 'Application with the same name already exists',
    };
  }

  const newApp = await Applications.create({
    name,
    description,
    is_deleted: false,
    is_active: true,
    created_at: new Date(),
  });

  const adminGroup = await UserGroup.findOne(
    { name: config.get('admin_group_name'), is_deleted: false },
    { _id: 1 }
  );

  if (!adminGroup) {
    return {
      success: false,
      message: 'Could not find Admin Group',
    };
  }

  await UserGroupApplications.create({
    app_id: newApp._id,
    group_id: adminGroup._id,
  });

  return {
    success: true,
    application: newApp,
  };
};

export const getAllApplicationsService = async (options: FilterOptions) => {
  const { page, limit, search, status, groupIds } = options;
  const pipeline = getPaginatedFilteredApplicationsPipeline({
    page,
    limit,
    search,
    status,
    groupIds,
  });

  const result = await Applications.aggregate(pipeline);
  const data = result[0];
  const applications = data.data;
  const totalDocs = data.metadata[0]?.total || 0;

  return {
    applications,
    pagination: {
      total: totalDocs,
      page,
      limit,
      totalPages: Math.ceil(totalDocs / limit),
      hasNextPage: page * limit < totalDocs,
      hasPrevPage: page > 1,
    },
  };
};

export const getUserApplicationsService = async (options: FilterOptions) => {
  const { userId, page, limit, search, status } = options;

  const user = await Users.findById(userId);
  if (!user) {
    return {
      success: false,
      message: 'User not found',
    };
  }

  const userSettings = await Settings.findOne({ user_id: userId });
  const warning_rate_threshold = userSettings?.warning_rate_threshold ?? 10;
  const error_rate_threshold = userSettings?.error_rate_threshold ?? 20;

  // Get user's accessible app IDs
  const userGroups = await UserGroupMembers.find({
    user_id: userId,
    is_active: true,
    is_removed: false,
  }).select('group_id');

  let accessibleAppIds: mongoose.Types.ObjectId[] = [];
  if (userGroups.length > 0) {
    const userGroupIds = userGroups.map((g) => g.group_id as mongoose.Types.ObjectId);
    const userGroupApps = await UserGroupApplications.find({
      group_id: { $in: userGroupIds },
      is_active: true,
      is_removed: false,
    }).select('app_id');
    accessibleAppIds = userGroupApps.map((a) => a.app_id as mongoose.Types.ObjectId);
  }

  if (accessibleAppIds.length === 0) {
    return {
      success: true,
      applications: [],
      pagination: { total: 0, page, limit, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    };
  }

  const pipeline = getPaginatedFilteredApplicationsPipeline({
    page,
    limit,
    search,
    status,
    accessibleAppIds,
    warning_rate_threshold,
    error_rate_threshold,
  });

  const result = await Applications.aggregate(pipeline);
  const data = result[0];
  const applications = data.data;
  const totalDocs = data.metadata[0]?.total || 0;

  // Add pin status to applications
  const pinnedAppIds = new Set(user.pinned_apps.map((id) => id.toString()));
  const applicationsWithPinStatus = applications.map((app: Application) => ({
    ...app,
    isPinned: pinnedAppIds.has(app._id.toString()),
  }));

  return {
    success: true,
    applications: applicationsWithPinStatus,
    pagination: {
      total: totalDocs,
      page,
      limit,
      totalPages: Math.ceil(totalDocs / limit),
      hasNextPage: page * limit < totalDocs,
      hasPrevPage: page > 1,
    },
  };
};

export const updateApplicationService = async (
  appId: string,
  updates: { name?: string; description?: string }
) => {
  const app = await Applications.findById(appId);
  if (!app || app.is_deleted) {
    return {
      success: false,
      message: 'Application not found',
    };
  }

  app.description = updates.description || app.description;
  app.name = updates.name || app.name;
  await app.save();

  const detailedApps = await getDetailedApplications([app._id as mongoose.Types.ObjectId]);

  return {
    success: true,
    application: detailedApps[0],
  };
};

export const deleteApplicationService = async (appId: string) => {
  const app = await Applications.findById(appId);

  if (!app || app.is_deleted) {
    return {
      success: false,
      message: 'Application not found',
    };
  }

  app.is_deleted = true;
  app.is_active = false;
  await app.save();
  await UserGroupApplications.updateMany({ app_id: appId }, { is_active: false });

  return {
    success: true,
  };
};

export const toggleApplicationStatusService = async (appId: string, is_active: boolean) => {
  const app = await Applications.findById(appId);

  if (!app || app.is_deleted) {
    return {
      success: false,
      message: 'Application not found',
    };
  }

  app.is_active = is_active;
  await app.save();
  await UserGroupApplications.updateMany(
    { app_id: appId, is_removed: false },
    { is_active: is_active }
  );

  return {
    success: true,
  };
};

export const getAppCriticalLogsService = async (appId: string) => {
  const pipeline = getAppCriticalLogsPipeline(appId);
  const logStats = await Logs.aggregate(pipeline);

  const totalLogs = logStats.reduce((sum: number, log: any) => sum + log.count, 0);

  return {
    totalLogs: totalLogs,
    errorLogs: logStats.find((log: any) => log._id === 'error')?.count || 0,
    warningLogs: logStats.find((log: any) => log._id === 'warn')?.count || 0,
  };
};

export const pinApplicationService = async (userId: string, appId: string) => {
  const user = await Users.findById(userId);

  if (!user) {
    return {
      success: false,
      message: 'User not found',
      statusCode: 404,
    };
  }

  const alreadyPinned = user.pinned_apps.some((id) => id.toString() === appId);

  if (alreadyPinned) {
    return {
      success: false,
      message: 'Application already pinned',
      statusCode: 400,
    };
  }

  if (user.pinned_apps.length >= 3) {
    return {
      success: false,
      message: 'Cannot pin more than 3 apps',
      statusCode: 400,
    };
  }

  user.pinned_apps.push(new mongoose.Types.ObjectId(appId));
  await user.save();

  return {
    success: true,
  };
};

export const unpinApplicationService = async (userId: string, appId: string) => {
  const user = await Users.findById(userId);

  if (!user) {
    return {
      success: false,
      message: 'User not found',
      statusCode: 404,
    };
  }

  if (!user.pinned_apps.includes(new mongoose.Types.ObjectId(appId))) {
    return {
      success: false,
      message: 'Application is not pinned',
      statusCode: 400,
    };
  }

  user.pinned_apps = user.pinned_apps.filter((id) => id.toString() !== appId);
  await user.save();

  return {
    success: true,
  };
};

export const getUserPinnedAppsService = async (userId: string) => {
  const user = await Users.findById(userId).select('pinned_apps');

  if (!user) {
    return {
      success: false,
      message: 'User not found',
    };
  }

  return {
    success: true,
    pinned_apps: user.pinned_apps,
  };
};

export const getDetailedApplications = async (appIds: mongoose.Types.ObjectId[]) => {
  const pipeline = getDetailedApplicationsPipeline(appIds);
  const detailedApplications = await Applications.aggregate(pipeline);
  return detailedApplications;
};
