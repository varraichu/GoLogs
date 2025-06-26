import { UserPayload } from '../userPayload';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
export {};
