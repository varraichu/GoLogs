import { Request, Response } from 'express';
import {
  assignApplicationsToGroup,
} from '../services/userGroup.service';

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
