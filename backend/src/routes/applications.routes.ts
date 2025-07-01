import express from 'express';
import { protect, isAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

import { createApplicationSchema, applicationParamsSchema } from '../schemas/application.validator';

import { createApplication, deleteApplication } from '../controllers/applications.controller';

const router = express.Router();

// router.use(protect, isAdmin);

// router.get('/', getAllUserGroups);
router.post('/', validate(createApplicationSchema), createApplication);

// router.get('/:groupId', validate(userGroupParamsSchema), getUserGroupById);
// router.patch('/:groupId', validate(updateUserGroupSchema), updateUserGroup);
router.delete('/:appId', validate(applicationParamsSchema), deleteApplication);

export default router;
