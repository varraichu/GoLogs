import { Response } from 'express';
import { IAuthRequest } from '../middleware/auth.middleware';
import { Request } from 'express';
import {
  CreateUserGroupInput,
  UpdateUserGroupInput,
  UserGroupParams,
  userGroupStatusInput,
} from '../schemas/userGroup.validator';
import {
  createUserGroupService,
  getAllUserGroupsService,
  getAllUserGroupInfoService,
  getUserGroupByIdService,
  updateUserGroupService,
  deleteUserGroupService,
  toggleGroupStatusService,
  userGroupUsersService,
  updateUserGroupAppAccessService,
} from '../services/userGroup.service';

export const updateUserGroupAppAccess = async (req: Request, res: Response): Promise<void> => {
  const { groupId } = req.params;
  const { appIds } = req.body;

  if (!Array.isArray(appIds)) {
    res.status(400).json({ message: 'appIds must be an array' });
    return;
  }

  await updateUserGroupAppAccessService(groupId, appIds);
  res.status(200).json({ message: 'Application access updated' });
  return;
};

export const createUserGroup = async (req: IAuthRequest, res: Response) => {
  const { name, description, memberEmails } = req.body as CreateUserGroupInput;

  const result = await createUserGroupService({ name, description, memberEmails });

  if (result.error) {
    res.status(400).json({ message: result.error });
    return;
  }

  res.status(201).json(result.data);
  return;
};

export const getAllUserGroups = async (req: IAuthRequest, res: Response) => {
  const groups = await getAllUserGroupsService();
  res.status(200).json(groups);
  return;
};

export const getAllUserGroupInfo = async (req: IAuthRequest, res: Response) => {
  const { search = '', status = 'all', page = '1', limit = '6', appIds = '' } = req.query;

  const options = {
    search: search as string,
    status: status as string,
    page: parseInt(page as string, 10),
    limit: parseInt(limit as string, 10),
    appIds: (appIds as string) ? (appIds as string).split(',') : [],
  };

  const result = await getAllUserGroupInfoService(options);
  res.status(200).json(result);
  return;
};

export const getUserGroupById = async (req: IAuthRequest, res: Response) => {
  const { groupId } = req.params as UserGroupParams;
  const result = await getUserGroupByIdService(groupId);

  if (result.error) {
    res.status(404).json({ message: result.error });
    return;
  }

  res.status(200).json(result.data);
  return;
};

export const updateUserGroup = async (req: IAuthRequest, res: Response) => {
  const { groupId } = req.params as UserGroupParams;
  const updateData = req.body as UpdateUserGroupInput;
  const userEmail = req.user?.email;

  const result = await updateUserGroupService(groupId, updateData, userEmail);

  if (result.error) {
    const statusCode = result.error.includes('not found')
      ? 404
      : result.error.includes('cannot be renamed') ||
          result.error.includes('Cannot remove yourself')
        ? 403
        : 400;
    res.status(statusCode).json({ message: result.error });
    return;
  }

  res.status(200).json(result.data);
  return;
};

export const deleteUserGroup = async (req: IAuthRequest, res: Response) => {
  const { groupId } = req.params as UserGroupParams;
  const result = await deleteUserGroupService(groupId);

  if (result.error) {
    const statusCode = result.error.includes('not found') ? 404 : 403;
    res.status(statusCode).json({ message: result.error });
    return;
  }

  res.status(204).send();
  return;
};

export const toggleGroupStatus = async (req: IAuthRequest, res: Response) => {
  const { groupId } = req.params as UserGroupParams;
  const { is_active } = req.body as userGroupStatusInput;

  const result = await toggleGroupStatusService(groupId, is_active);

  if (result.error) {
    res.status(404).json({ message: result.error });
    return;
  }

  res.status(200).json({ message: result.message });
  return;
};

export const userGroupUsers = async (req: IAuthRequest, res: Response) => {
  const { groupId } = req.params;
  const users = await userGroupUsersService(groupId);
  res.status(200).json({ users });
  return;
};
