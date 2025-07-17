import jwt from 'jsonwebtoken';
import config from 'config';

/**
 * Generates a JSON Web Token (JWT) with a 7-day expiration.
 * @param payload - The data to include in the token payload.
 * @returns string - The signed JWT as a string.
 */
export const generateToken = (payload: object): string => {
  return jwt.sign(payload, config.get('jwt.secret') as string, {
    expiresIn: '7d',
  });
};
