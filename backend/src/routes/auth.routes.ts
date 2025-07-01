import express from 'express';
import { googleOauthHandler } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { googleOauthCallbackSchema } from '../schemas/auth.validator';

const router = express.Router();

router.get('/google', validate(googleOauthCallbackSchema), googleOauthHandler);

export default router;
