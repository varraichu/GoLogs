import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import config from 'config';
import User from '../models/Users';
import { generateToken } from '../utils/jwt.util';
import { GoogleOauthCallbackInput } from '../schemas/auth.validator';

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

    if (!user) {
      user = await User.create({
        email: payload.email,
        username: payload.name || payload.email.split('@')[0],
        picture_url: payload.picture,
        role: 'user',
      });
    }

    const jwtPayload = {
      _id: user._id,
      email: user.email,
      role: user.role,
    };
    const token = generateToken(jwtPayload);

    return res.redirect(`${frontendUrl}?token=${token}`);
  } catch (error: any) {
    console.error('Error during Google OAuth:', error);
    res
      .status(500)
      .redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
  }
};
