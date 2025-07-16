import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { GoogleOauthCallbackInput } from '../schemas/auth.validator';
import { IAuthRequest } from 'src/middleware/auth.middleware';

export const googleOauthHandler = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query as GoogleOauthCallbackInput;

  const result = await authService.processGoogleOauth(code);

  if (!result.success) {
    if (result.redirectUrl) {
      res.redirect(result.redirectUrl);
      return;
    }
    res.status(400).json({ message: result.error });
    return;
  }

  res.redirect(result.redirectUrl!);
  return;
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

  const result = await authService.processDevLogin(email);

  if (!result.success) {
    res.status(404).json({ message: result.error });
    return;
  }

  res.status(200).json({ token: result.token });
  return;
};
