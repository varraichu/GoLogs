import express from 'express';
import { updateUserGroupAppAccess } from '../controllers/userGroup.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

router.patch('/:groupId/app-access', authenticate, authorizeAdmin, updateUserGroupAppAccess);

export default router;
