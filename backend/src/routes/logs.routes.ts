import express from 'express';
import { protect, isAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

import {
  getAllCachedLogSummary,
  getAllLogs,
  getCachedLogSummary,
  getLogTTL,
  getUserLogs,
  getUserLogSummary,
  updateLogTTL,
} from '../controllers/logs.controller';
import { updateLogTTLSchema, logsQuerySchema } from '../schemas/logs.validator';

const router = express.Router();

router.get('/', protect, isAdmin, validate(logsQuerySchema), getAllLogs);
// router.get('/', validate(logsQuerySchema), getAllLogs);

router.patch(
  '/config/ttl',
  protect,
  isAdmin,
  validate(updateLogTTLSchema), // Using the new schema
  updateLogTTL
);
router.get('/admin-cached-summary/', protect, isAdmin, getAllCachedLogSummary);

router.get('/cached-summary/:userId', validate(logsQuerySchema), getCachedLogSummary);
router.get('/get/ttl', getLogTTL);

router.get('/:userId', validate(logsQuerySchema), getUserLogs);
router.get('/summary/:userId', validate(logsQuerySchema), getUserLogSummary);

// router.get('/cached-summary/:userId', validate(logsQuerySchema), getCachedLogSummary);
// router.patch(
//   '/config/ttl',
//   validate(updateLogTTLSchema), // Using the new schema
//   updateLogTTL
// );

// router.get('/', protect, getAllLogs);
export default router;
