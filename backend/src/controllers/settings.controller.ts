import { Response } from 'express';
import { IAuthRequest } from '../middleware/auth.middleware';
import Settings from '../models/Settings';
import {
  CreateSettingsInput,
  UpdateSettingsInput,
  SettingsParams,
} from '../schemas/settings.validator';
import { getOrCreateSettings, updateSettings } from '../services/settings.service';
import mongoose from 'mongoose';
import logger from '../config/logger';
import Users from '../models/Users';

export const getSettingsById = async (req: IAuthRequest, res: Response) => {
  try {
    const { user_id } = req.params as SettingsParams;
    const userObjectId = new mongoose.Types.ObjectId(user_id);
    if (!(await Users.exists({ _id: userObjectId }))) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const settings = await getOrCreateSettings(userObjectId);
    res.status(200).json(settings);
    return;
  } catch (error) {
    logger.error('Error fetching or creating settings by user ID:', error);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

// export const createSettingsController = async (
//   req: IAuthRequest,
//   res: Response
// ) => {
//   try {
//     const { user_id } = req.params as SettingsParams;

//     const existing = await getSettings(new mongoose.Types.ObjectId(user_id));
//     if (existing) {
//       return res.status(409).json({ message: 'Settings already exist for this user' });
//     }

//     const settings = await createSettings(new mongoose.Types.ObjectId(user_id));
//     return res.status(201).json(settings);
//   } catch (error) {
//     logger.error('Error creating settings:', error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

export const updateSettingsController = async (req: IAuthRequest, res: Response) => {
  try {
    const { user_id } = req.params as SettingsParams;
    const userObjectId = new mongoose.Types.ObjectId(user_id);

    if (!(await Users.exists({ _id: userObjectId }))) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const updates = req.body as UpdateSettingsInput;

    const updated = await updateSettings(userObjectId, updates);

    if (!updated) {
      res.status(404).json({ message: 'Settings not found for user' });
      return;
    }

    res.status(200).json(updated);
    return;
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};
