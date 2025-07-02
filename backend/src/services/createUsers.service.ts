import User, { IUser } from '../models/Users';
import { getDirectoryClient } from '../utils/googleDirectory.util';
import logger from '../config/logger';

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

  // Validate new emails in Google Directory
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
    username: email.split('@')[0],
  }));

  const createdUsers = await User.insertMany(newUsersToCreate);

  return [...existingUsers, ...createdUsers];
};
