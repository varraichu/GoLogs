import express from 'express';
// import { googleOauthHandler } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { googleOauthCallbackSchema } from '../schemas/auth.validator';
import { logoutHandler, selfData } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

// // This is for development purposes only, allowing login without OAuth
import { googleOauthHandler, devLoginHandler } from '../controllers/auth.controller';
// This  is for development purposes only, allowing login without OAuth

const router = express.Router();

// This route is for development purposes only, allowing login without OAuth
router.post('/login', devLoginHandler);
// This route is for development purposes only, allowing login without OAuth

router.get('/google', validate(googleOauthCallbackSchema), googleOauthHandler);

router.get('/me', protect, selfData);

router.post('/logout', protect, logoutHandler);

export default router;
