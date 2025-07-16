import { Response } from 'express';
import { IAuthRequest } from '../middleware/auth.middleware';
import {
  CreateApplicationInput,
  UpdateApplicationInput,
  ApplicationParams,
  applicationStatusInput,
  UserIdParams,
} from '../schemas/application.validator';
import {
  createApplicationService,
  getAllApplicationsService,
  getUserApplicationsService,
  updateApplicationService,
  deleteApplicationService,
  toggleApplicationStatusService,
  getAppCriticalLogsService,
  pinApplicationService,
  unpinApplicationService,
  getUserPinnedAppsService,
} from '../services/applications.service';

export const createApplication = async (req: IAuthRequest, res: Response) => {
  const { name, description } = req.body as CreateApplicationInput;
  const result = await createApplicationService(name, description);

  if (!result.success) {
    res.status(400).json({ message: result.message });
    return;
  }

  res
    .status(201)
    .json({ message: 'Application created successfully', application: result.application });
  return;
};

export const getAllApplications = async (req: IAuthRequest, res: Response) => {
  const search = req.query.search as string | undefined;
  const groupIds = (req.query.groupIds as string)?.split(',') || [];
  const status = req.query.status as 'active' | 'inactive' | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 99;

  const { applications, pagination } = await getAllApplicationsService({
    search,
    groupIds,
    status,
    page,
    limit,
  });

  res.status(200).json({ message: 'Applications fetched successfully', applications, pagination });
  return;
};

export const getUserApplications = async (req: IAuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params as UserIdParams;
  const search = req.query.search as string | undefined;
  const status = req.query.status as 'active' | 'inactive' | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 8;

  const result = await getUserApplicationsService({
    userId,
    search,
    status,
    page,
    limit,
  });

  if (!result.success) {
    res.status(404).json({ message: result.message });
    return;
  }

  res.status(200).json({
    message: 'Applications fetched successfully',
    applications: result.applications,
    pagination: result.pagination,
  });
  return;
};

export const updateApplication = async (req: IAuthRequest, res: Response) => {
  const { appId } = req.params as ApplicationParams;
  const { name, description } = req.body as UpdateApplicationInput;

  const result = await updateApplicationService(appId, { name, description });

  if (!result.success) {
    res.status(404).json({ message: result.message });
    return;
  }

  res
    .status(200)
    .json({ message: 'Application updated successfully', applications: result.application });
  return;
};

export const deleteApplication = async (req: IAuthRequest, res: Response) => {
  const { appId } = req.params as ApplicationParams;
  const result = await deleteApplicationService(appId);

  if (!result.success) {
    res.status(404).json({ message: result.message });
    return;
  }

  res.status(204).send();
  return;
};

export const toggleApplicationStatus = async (req: IAuthRequest, res: Response) => {
  const { appId } = req.params as ApplicationParams;
  const { is_active } = req.body as applicationStatusInput;

  const result = await toggleApplicationStatusService(appId, is_active);

  if (!result.success) {
    res.status(404).json({ message: result.message });
    return;
  }

  res.status(200).json({ message: 'Application successfully set to', is_active });
  return;
};

export const getAppCriticalLogs = async (req: IAuthRequest, res: Response) => {
  const { appId } = req.params as ApplicationParams;
  const criticalLogs = await getAppCriticalLogsService(appId);

  res.status(200).json(criticalLogs);
  return;
};

export const pinApplication = async (req: IAuthRequest, res: Response): Promise<void> => {
  const { userId, appId } = req.params as { userId: string; appId: string };
  const result = await pinApplicationService(userId, appId);

  if (!result.success) {
    res.status(result.statusCode || 400).json({ message: result.message });
    return;
  }

  res.status(200).json({ message: 'Application pinned successfully' });
  return;
};

export const unpinApplication = async (req: IAuthRequest, res: Response): Promise<void> => {
  const { userId, appId } = req.params as { userId: string; appId: string };
  const result = await unpinApplicationService(userId, appId);

  if (!result.success) {
    res.status(result.statusCode || 400).json({ message: result.message });
    return;
  }

  res.status(200).json({ message: 'Application unpinned successfully' });
  return;
};

export const getUserPinnedApps = async (req: IAuthRequest, res: Response): Promise<void> => {
  const userId = req.params.id;
  const result = await getUserPinnedAppsService(userId);

  if (!result.success) {
    res.status(404).json({ message: result.message });
    return;
  }

  res.status(200).json({ pinned_apps: result.pinned_apps });
  return;
};
