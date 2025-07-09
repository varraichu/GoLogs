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

// Add routes for pinning, unpinning, and getting critical logs for apps
router.post('/pin/:userId/:appId', protect, pinApplication); // Pin an app
router.post('/unpin/:userId/:appId', protect, unpinApplication); // Unpin an app
router.get('/logs/critical/:appId', protect, getAppCriticalLogs); // Get critical logs for an app

export default router;
