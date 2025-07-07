import mongoose from 'mongoose';
import Settings from '../models/Settings';
import {ISettings} from "../models/Settings"

export const getOrCreateSettings = async (
  user_id: mongoose.Types.ObjectId
): Promise<ISettings> => {
  const defaultSettings = {
    user_id,
    error_rate_threshold: 30,
    warning_rate_threshold: 15,
    silent_duration: 10,
  };

  const settings = await Settings.findOneAndUpdate(
    { user_id },
    { $setOnInsert: defaultSettings },
    { new: true, upsert: true }
  );

  return settings;
};

interface UpdateSettingsInput {
  error_rate_threshold?: number;
  warning_rate_threshold?: number;
  silent_duration?: number;
}

export const updateSettings = async (
  user_id: mongoose.Types.ObjectId,
  updates: UpdateSettingsInput
): Promise<ISettings | null> => {
  return await Settings.findOneAndUpdate(
    { user_id },
    { $set: updates },
    { new: true }
  );
};