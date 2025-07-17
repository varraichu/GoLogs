import User, { IUser } from '../models/Users';
import { getDirectoryClient } from '../utils/googleDirectory.util';
import logger from '../config/logger';
import Settings from '../models/Settings';

/**
 * Finds existing users by their emails or creates new ones after validating them in the Google Directory.
 * Also creates default settings for any newly created users.
 * @param emails - An array of user email addresses to find or create.
 * @returns A list of existing and newly created user documents.
 */
export const findOrCreateUsersByEmail = async (emails: string[]): Promise<IUser[]> => {
  if (!emails || emails.length === 0) {
    return [];
  }

  const existingUsers = await User.find({ email: { $in: emails } });
  const existingEmails = new Set(existingUsers.map((u) => u.email));

  const newEmails = emails.filter((email) => !existingEmails.has(email));

  if (newEmails.length === 0) {
    return existingUsers;
  }

  const directory = getDirectoryClient();

  const validDirectoryEmails: string[] = [];

  for (const email of newEmails) {
    try {
      await directory.users.get({ userKey: email });
      validDirectoryEmails.push(email);
    } catch (err: any) {
      // If user not found, skip. Handle other error codes if needed below.
      if (err.code !== 404) {
        logger.error(`Error checking directory for ${email}:`, err.message);
      }
    }
  }

  if (validDirectoryEmails.length === 0) {
    return existingUsers;
  }

  const newUsersToCreate = validDirectoryEmails.map((email) => ({
    email: email,
    username: email.split('@')[0].split('.').join(' '),
  }));

  const createdUsers = await User.insertMany(newUsersToCreate);

  if (createdUsers && createdUsers.length > 0) {
    const defaultSettingsToCreate = createdUsers.map((user) => ({
      user_id: user._id,
      error_rate_threshold: 10,
      warning_rate_threshold: 25,
      silent_duration: 12,
    }));

    await Settings.insertMany(defaultSettingsToCreate);
    logger.info(`Created default settings for ${createdUsers.length} new users.`);
  }

  return [...existingUsers, ...createdUsers];
};
