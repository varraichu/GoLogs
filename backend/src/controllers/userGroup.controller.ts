import { Request, Response } from 'express';
import {
  assignApplicationsToGroup,
} from '../services/userGroup.service';
// Update the import path below to the correct location of your UserGroups model
import UserGroups from '../models/UserGroups'; // Example: adjust '../models/UserGroups' as needed

export const updateUserGroupAppAccess = async (req: Request, res: Response): Promise<void> => {
  const { groupId } = req.params;
  const { appIds } = req.body; 

  if (!Array.isArray(appIds)) {
    res.status(400).json({ message: 'appIds must be an array' });
    return;
  }

  try {
    await assignApplicationsToGroup(groupId, appIds);
    res.status(200).json({ message: 'Application access updated' });
  } catch (error) {
    console.error('Error updating app access:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllUserGroups = async (req: Request, res: Response) => {
  try {
    const groups = await UserGroups.find(); // Adjust model name if different
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user groups' });
  }
};
