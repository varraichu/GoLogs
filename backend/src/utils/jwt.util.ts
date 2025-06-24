import jwt from 'jsonwebtoken';
import config from 'config';

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, config.get('JWT_SECRET') as string, {
    expiresIn: '7d',
  });
};
