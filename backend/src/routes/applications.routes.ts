import express from 'express';
import { protect, isAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

import {
  createApplicationSchema,
  applicationParamsSchema,
  updateApplicationSchema,
} from '../schemas/application.validator';

import {
  createApplication,
  deleteApplication,
  getAllApplications,
  updateApplication,
} from '../controllers/applications.controller';

const router = express.Router();

// router.use(protect, isAdmin);

router.get('/', getAllApplications);
router.post('/', validate(createApplicationSchema), createApplication);

// router.get('/:groupId', validate(userGroupParamsSchema), getUserGroupById);
router.patch('/:appId', validate(updateApplicationSchema), updateApplication);
router.delete('/:appId', validate(applicationParamsSchema), deleteApplication);

export default router;
