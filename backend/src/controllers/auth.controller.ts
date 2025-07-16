import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { GoogleOauthCallbackInput } from '../schemas/auth.validator';

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
