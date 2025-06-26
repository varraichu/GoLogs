// import { Request, Response, NextFunction } from 'express';
// import Users from '../models/Users';

// export const authenticate = (req: Request, res: Response, next: NextFunction) => {
//   // Assume `req.user` is already populated by some auth middleware (JWT/session)
//   if (!req.user) {
//     return res.status(401).json({ message: 'Unauthorized' });
//   }
//   next();
// };

// export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
//   if (req.user.role !== 'admin') {
//     return res.status(403).json({ message: 'Forbidden: Admins only' });
//   }
//   next();
// };

// import { Request, Response, NextFunction } from 'express';

// export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
//   // ✅ inject test user
//   req.user = {
//     _id: '68592dacc747d9cbf4dc0e55',
//     username: 'testuser',
//     email: 'testuser@example.com',
//     role: 'admin',
//     picture_url: 'https://example.com/profile.png',
//     pinned_apps: [],
//   };
//   next();
// };

// export const authorizeAdmin = (req: Request, res: Response, next: NextFunction): void => {
//   if (req.user?.role !== 'admin') {
//     res.status(403).json({ message: 'Forbidden: Admins only' });
//     return;
//   }
//   next();
// };

import { Request, Response, NextFunction } from 'express';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const isAdmin = true;

  if (!isAdmin) {
    res.status(403).json({ message: 'Forbidden: Admins only' });
    return; 
  }

  next();
};
