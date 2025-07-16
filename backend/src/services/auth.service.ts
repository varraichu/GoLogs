import { OAuth2Client } from 'google-auth-library';
import config from 'config';
import User from '../models/Users';
import UserGroup from '../models/UserGroups';
import UserGroupMembers from '../models/UserGroupMembers';
import { generateToken } from '../utils/jwt.util';

const googleClient = new OAuth2Client({
  clientId: config.get<string>('google.client_id'),
  clientSecret: config.get<string>('google.client_secret'),
  redirectUri: config.get<string>('google.redirect_uri'),
});

export interface GoogleOauthResult {
  success: boolean;
  token?: string;
  error?: string;
  redirectUrl?: string;
}

export interface DevLoginResult {
  success: boolean;
  token?: string;
  error?: string;
}

export interface UserPayload {
  _id: any;
  email: string;
  username: string;
  isAdmin: boolean;
  picture_url?: string;
}

export class AuthService {
  private async checkAdminStatus(userId: any): Promise<boolean> {
    const adminGroup = await UserGroup.findOne(
      { name: config.get('admin_group_name'), is_deleted: false },
      { _id: 1 }
    );

    if (!adminGroup) {
      return false;
    }

    const isAdminGroupMember = await UserGroupMembers.findOne({
      group_id: adminGroup._id,
      user_id: userId,
      is_active: true,
    });

    return !!isAdminGroupMember;
  }

  private async createJwtToken(userPayload: UserPayload): Promise<string> {
    return generateToken(userPayload);
  }

  async processGoogleOauth(code: string): Promise<GoogleOauthResult> {
    const frontendUrl = config.get<string>('FRONTEND_URL');

    try {
      // Get tokens from Google
      const { tokens } = await googleClient.getToken(code);
      googleClient.setCredentials(tokens);

      const { id_token } = tokens;
      if (!id_token) {
        return {
          success: false,
          error: 'ID token not found',
        };
      }

      // Verify the ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: id_token,
        audience: config.get<string>('google.client_id'),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return {
          success: false,
          error: 'Could not get payload from ticket',
        };
      }

      // Check email domain restriction
      if (!payload.email || !payload.email.endsWith('@gosaas.io')) {
        return {
          success: false,
          error: "Access denied. Only '@gosaas.io' emails are allowed.",
        };
      }

      // Find or create user
      let user = await User.findOne({ email: payload.email });
      let isAdmin = false;

      if (!user) {
        user = await User.create({
          email: payload.email,
          username: payload.name || payload.email.split('@')[0],
          picture_url: payload.picture,
        });
      } else {
        isAdmin = await this.checkAdminStatus(user._id);
      }

      // Create JWT payload and token
      const jwtPayload: UserPayload = {
        _id: user._id,
        email: user.email,
        username: user.username,
        isAdmin,
        picture_url: user.picture_url,
      };

      const token = await this.createJwtToken(jwtPayload);

      return {
        success: true,
        token,
        redirectUrl: `${frontendUrl}?token=${token}`,
      };
    } catch (error: any) {
      console.error('Error during Google OAuth:', error);
      return {
        success: false,
        error: error.message,
        redirectUrl: `${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`,
      };
    }
  }

  async processDevLogin(email: string): Promise<DevLoginResult> {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      const adminGroup = await UserGroup.findOne({ name: 'Admin Group', is_deleted: false });
      const isAdmin = await UserGroupMembers.exists({
        user_id: user._id,
        group_id: adminGroup?._id,
        is_active: true,
      });

      const userPayload: UserPayload = {
        _id: user._id,
        email: user.email,
        username: user.username,
        isAdmin: !!isAdmin,
        picture_url: user.picture_url,
      };

      const token = await this.createJwtToken(userPayload);

      return {
        success: true,
        token,
      };
    } catch (error: any) {
      console.error('Error during dev login:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const authService = new AuthService();
