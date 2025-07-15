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
  pinApplication,
  unpinApplication,
  getAppCriticalLogs,
} from '../controllers/applications.controller';

import { getUserPinnedApps } from '../controllers/applications.controller';

const router = express.Router();

router.get('/', protect, isAdmin, getAllApplications);
router.get('/:userId', protect, getUserApplications);

router.post('/', protect, isAdmin, validate(createApplicationSchema), createApplication);

router.patch('/:appId', protect, isAdmin, validate(updateApplicationSchema), updateApplication);

router.delete('/:appId', protect, isAdmin, validate(applicationParamsSchema), deleteApplication);

router.patch(
  '/status/:appId',
  protect,
  isAdmin,
  validate(applicationStatusSchema),
  toggleApplicationStatus
);

router.get('/logs/critical/:appId', protect, getAppCriticalLogs);

router.post('/pin/:userId/:appId', protect, pinApplication);

router.post('/unpin/:userId/:appId', protect, unpinApplication);

router.get('/user/:id', protect, getUserPinnedApps);

export default router;
