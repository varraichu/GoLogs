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
  getUserApplications,
  toggleApplicationStatus,
  updateApplication,
} from '../controllers/applications.controller';

const router = express.Router();

// router.use(protect, isAdmin);

router.get('/', protect, isAdmin, getAllApplications);
router.get('/:userId', getUserApplications);
router.post('/', protect, isAdmin, validate(createApplicationSchema), createApplication);

router.patch('/:appId', protect, isAdmin, validate(updateApplicationSchema), updateApplication);
router.patch(
  '/status/:appId',
  protect,
  isAdmin,
  validate(applicationStatusSchema),
  toggleApplicationStatus
);
router.delete('/:appId', protect, isAdmin, validate(applicationParamsSchema), deleteApplication);

export default router;
