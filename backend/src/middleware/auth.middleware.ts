import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from 'config';
import * as core from 'express-serve-static-core';
import UserGroup from '../models/UserGroups';
import UserGroupMember from '../models/UserGroupMembers';
import logger from '../config/logger';

export interface IAuthRequest<
  P = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = core.Query,
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: {
    _id: string;
    email: string;
    isAdmin: boolean;
  };
}

export const protect = (req: IAuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.token
  if (!token) {
    res.status(401).json({ message: 'Unauthorized' })
    return;
  }
  try {
    const decoded = jwt.verify(token, config.get('jwt.secret') as string) as JwtPayload;

    req.user = {
      _id: decoded._id,
      email: decoded.email,
      isAdmin: decoded.isAdmin,
    };
    next()
  } catch {
    res.status(403).json({ message: 'Invalid token' })
    return;
  }
};

export const isAdmin = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized' });
    return;
  }

  if (!req.user.isAdmin) {
    res.status(403).json({ message: 'Forbidden. Admin access required.' });
    return;
  }

  try {
    const adminGroup = await UserGroup.findOne({
      name: config.get('admin_group_name'),
      is_deleted: false,
    });

    if (!adminGroup) {
      res.status(403).json({ message: 'Forbidden. Admin access required.' });
      return;
    }

    const membership = await UserGroupMember.findOne({
      user_id: req.user._id,
      group_id: adminGroup._id,
      is_active: true,
    });

    if (membership) {
      next();
      return;
    }

    res.status(403).json({ message: 'Forbidden. Admin access required.' });
    return;
  } catch (error) {
    logger.error('Error during admin authorization check:', error);
    res.status(500).json({ message: 'Server error during authorization.' });
    return;
  }
};

export const isSelfOrAdmin = (getTargetUserId: (req: IAuthRequest) => string) => {
  return async (req: IAuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const targetUserId = getTargetUserId(req);

    // Allow if self
    if (req.user._id === targetUserId) {
      next();
      return;
    }

    try {
      const adminGroup = await UserGroup.findOne({
        name: config.get('admin_group_name'),
        is_deleted: false,
      });

      if (!adminGroup) {
        res.status(403).json({ message: 'Forbidden. Admin access required.' });
        return;
      }

      const membership = await UserGroupMember.findOne({
        user_id: req.user._id,
        group_id: adminGroup._id,
        is_active: true,
      });

      if (membership) {
        next();
        return;
      }

      res.status(403).json({ message: 'Forbidden. You can only access your own resources.' });
      return;
    } catch (error) {
      logger.error('Error during admin authorization check:', error);
      res.status(500).json({ message: 'Server error during authorization.' });
      return;
    }
  };
};
