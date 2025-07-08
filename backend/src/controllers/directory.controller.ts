import { Response } from 'express';
import { getDirectoryClient } from '../utils/googleDirectory.util';
import { admin_directory_v1 } from 'googleapis';
import { IAuthRequest } from '../middleware/auth.middleware';

export const searchDirectory = async (req: IAuthRequest, res: Response) => {

  try {
    const directory = getDirectoryClient();

    const result = await directory.users.list({
      customer: 'my_customer',
      maxResults: 500,
      projection: 'basic',
      viewType: 'domain_public',
    });

    const users =
      result.data.users?.map((user: admin_directory_v1.Schema$User) => user.primaryEmail) || [];

    res.json({ emails: users });
  } catch (err) {
    console.error('Directory search failed:', err);
    res.status(500).json({ message: 'Failed to fetch directory users' });
  }
};
