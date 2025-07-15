import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import config from 'config';
import User from '../models/Users';
import UserGroup from '../models/UserGroups';
import UserGroupMembers from '../models/UserGroupMembers';
import { generateToken } from '../utils/jwt.util';
import { GoogleOauthCallbackInput } from '../schemas/auth.validator';
import { IAuthRequest } from 'src/middleware/auth.middleware';

const googleClient = new OAuth2Client({
  clientId: config.get<string>('google.client_id'),
  clientSecret: config.get<string>('google.client_secret'),
  redirectUri: config.get<string>('google.redirect_uri'),
});

export const googleOauthHandler = async (req: Request, res: Response) => {
  const frontendUrl = config.get<string>('FRONTEND_URL');

  try {
    const { code } = req.query as GoogleOauthCallbackInput;

    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    const { id_token } = tokens;
    if (!id_token) {
      res.status(400).send('ID token not found');
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: config.get<string>('google.client_id'),
    });

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).send('Could not get payload from ticket');
      return;
    }

    if (!payload.email || !payload.email.endsWith('@gosaas.io')) {
      res.status(400).json({ message: "Access denied. Only '@gosaas.io' emails are allowed." });
      return;
    }

    let user = await User.findOne({ email: payload.email });
    let isAdmin = false;
    const adminGroup = await UserGroup.findOne(
      { name: config.get('admin_group_name'), is_deleted: false },
      { _id: 1 }
    );

    if (!user) {
      user = await User.create({
        email: payload.email,
        username: payload.name || payload.email.split('@')[0],
        picture_url: payload.picture,
      });
    } else if (adminGroup) {
      let isAdminGroupMember = await UserGroupMembers.findOne({
        group_id: adminGroup._id,
        user_id: user._id,
        is_active: true,
      });

      if (isAdminGroupMember) {
        isAdmin = true;
      }
    }
    const jwtPayload = {
      _id: user._id,
      email: user.email,
      username: user.username,
      isAdmin,
      picture_url: user.picture_url,
    };
    const token = generateToken(jwtPayload);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.redirect(`${config.get('FRONTEND_URL')}/dashboard`);
  } catch (error: any) {
    console.error('Error during Google OAuth:', error);
    res
      .status(500)
      .redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
  }
};

export const logoutHandler = (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })
  res.status(200).json({ message: 'Logged out' })
};

export const selfData = async (req: IAuthRequest, res: Response) => {
  const userId = req.user?._id;
  const user = await User.findById(userId);

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const userObj = {
    _id: user._id,
    email: user.email,
    username: user.username,
    picture: user.picture_url,
    isAdmin: req.user?.isAdmin
  }

  res.status(200).json({ user: userObj });
};

// This is for development purposes only, allowing login without OAuth
export const devLoginHandler = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  console.log('🚀 Dev login hit:', email);

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const adminGroup = await UserGroup.findOne({ name: 'Admin Group', is_deleted: false });
  const isAdmin = await UserGroupMembers.exists({
    user_id: user._id,
    group_id: adminGroup?._id,
    is_active: true,
  });

  const token = generateToken({
    _id: user._id,
    email: user.email,
    isAdmin: !!isAdmin,
  });

  res.status(200).json({ token });
  return;
};
