import express from 'express';
import { protect, isAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

import {
  createApplicationSchema,
  applicationParamsSchema,
  updateApplicationSchema,
  applicationStatusSchema,
} from '../schemas/application.validator';

import {
  createApplication,
  deleteApplication,
  getAllApplications,
  toggleApplicationStatus,
  updateApplication,
} from '../controllers/applications.controller';

const router = express.Router();

// router.use(protect, isAdmin);

router.get('/', getAllApplications);
router.post('/', validate(createApplicationSchema), createApplication);

router.patch('/:appId', validate(updateApplicationSchema), updateApplication);
router.patch('/status/:appId', validate(applicationStatusSchema), toggleApplicationStatus);
router.delete('/:appId', validate(applicationParamsSchema), deleteApplication);

export default router;
