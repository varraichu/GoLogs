import express from 'express';
import { getAllUserGroups, updateUserGroupAppAccess } from '../controllers/userGroup.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

router.patch('/:groupId/app-access', authenticate, authorizeAdmin, updateUserGroupAppAccess);

router.get('/', authenticate, authorizeAdmin, getAllUserGroups); 

export default router;
