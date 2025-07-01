import express from 'express';
// import { googleOauthHandler } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { googleOauthCallbackSchema } from '../schemas/auth.validator';

// // This is for development purposes only, allowing login without OAuth
import { googleOauthHandler, devLoginHandler } from '../controllers/auth.controller';
// This  is for development purposes only, allowing login without OAuth

const router = express.Router();

// This route is for development purposes only, allowing login without OAuth
router.post('/login', devLoginHandler); 
// This route is for development purposes only, allowing login without OAuth

router.get('/google', validate(googleOauthCallbackSchema), googleOauthHandler);

export default router;
