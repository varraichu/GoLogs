import User, { IUser } from '../models/Users';

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

  const newUsersToCreate = newEmails.map((email) => ({
    email: email,
    username: email.split('@')[0],
  }));

  const createdUsers = await User.insertMany(newUsersToCreate);

  return [...existingUsers, ...createdUsers];
};
