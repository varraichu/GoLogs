import mongoose from 'mongoose';
import Settings from '../models/Settings';
import { ISettings } from '../models/Settings';

/**
 * Retrieves the user's settings or creates default settings if none exist.
 * @param user_id - The ID of the user.
 * @returns A settings object for the user.
 */
export const getOrCreateSettings = async (user_id: mongoose.Types.ObjectId): Promise<ISettings> => {
  const defaultSettings = {
    user_id,
    error_rate_threshold: 10,
    warning_rate_threshold: 25,
    silent_duration: 12,
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

/**
 * Updates the user's settings with the provided values.
 * @param user_id - The ID of the user.
 * @param updates - Partial settings object containing the fields to update.
 * @returns The updated settings object, or null if the user settings do not exist.
 */
export const updateSettings = async (
  user_id: mongoose.Types.ObjectId,
  updates: UpdateSettingsInput
): Promise<ISettings | null> => {
  return await Settings.findOneAndUpdate({ user_id }, { $set: updates }, { new: true });
};
