import mongoose from 'mongoose';
import Applications from '../models/Applications';
import UserGroupApplications from '../models/UserGroupApplications';
import UserGroupMembers from '../models/UserGroupMembers';
import Users from '../models/Users';
import Settings from '../models/Settings';
import {
  getPaginatedFilteredApplicationsPipeline,
  getDetailedApplicationsPipeline,
  getAppCriticalLogsPipeline,
} from '../aggregations/applications.aggregation';
import Logs from '../models/Logs';

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

/**
 * Creates a new application if one with the same name does not already exist.
 * @param name - The name of the application.
 * @param description - A brief description of the application.
 * @returns Promise<object> - Result of the creation attempt with success status and application info.
 */
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

  return {
    success: true,
    application: newApp,
  };
};

/**
 * Retrieves all applications with pagination and optional filtering by status, search query, and group IDs.
 * @param options - Filter and pagination options.
 * @returns Promise<object> - Paginated list of applications and metadata.
 */
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

/**
 * Retrieves applications accessible by a specific user, considering group membership and pinned status.
 * @param options - Filter and pagination options, including userId.
 * @returns Promise<object> - List of applications with pin status and pagination info.
 */
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

/**
 * Updates the name and/or description of a given application.
 * @param appId - The ID of the application to update.
 * @param updates - Object containing updated name and/or description.
 * @returns Promise<object> - Result of the update operation with updated application details.
 */
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

/**
 * Marks an application as deleted and deactivates all its group associations.
 * @param appId - The ID of the application to delete.
 * @returns Promise<object> - Result of the delete operation with success status.
 */
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

/**
 * Toggles the active status of an application and updates its group assignments accordingly.
 * @param appId - The ID of the application to update.
 * @param is_active - The new active status.
 * @returns Promise<object> - Result of the update operation with success status.
 */
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

/**
 * Retrieves counts of error and warning logs for a specific application using aggregation.
 * @param appId - The ID of the application.
 * @returns Promise<object> - Object containing total, error, and warning log counts.
 */
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

/**
 * Pins an application to the user's dashboard if it is not already pinned and the limit is not exceeded.
 * @param userId - The ID of the user.
 * @param appId - The ID of the application to pin.
 * @returns Promise<object> - Result of the pin operation with success status or error details.
 */
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

/**
 * Unpins an application from the user's dashboard if it is currently pinned.
 * @param userId - The ID of the user.
 * @param appId - The ID of the application to unpin.
 * @returns Promise<object> - Result of the unpin operation with success status or error message.
 */
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

/**
 * Retrieves the list of pinned application IDs for a given user.
 * @param userId - The ID of the user.
 * @returns Promise<object> - Result containing pinned applications or error message.
 */
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

/**
 * Retrieves detailed information for a list of applications using a pre-defined aggregation pipeline.
 * @param appIds - List of application ObjectIds.
 * @returns Promise<Application[]> - Array of detailed application objects.
 */
export const getDetailedApplications = async (appIds: mongoose.Types.ObjectId[]) => {
  const pipeline = getDetailedApplicationsPipeline(appIds);
  const detailedApplications = await Applications.aggregate(pipeline);
  return detailedApplications;
};