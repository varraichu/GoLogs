import express from 'express';
import { protect, isAdmin, isSelfOrAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

import {
  getAllCachedLogSummary,
  getAllLogs,
  getCachedLogSummary,
  getLogTTL,
  getUserLogs,
  updateLogTTL,
  exportUserLogs,
  exportAdminLogs,
  refreshLogGraph,
} from '../controllers/logs.controller';

import { updateLogTTLSchema, logsQuerySchema } from '../schemas/logs.validator';

const router = express.Router();

router.get('/', protect, isAdmin, validate(logsQuerySchema), getAllLogs);

router.patch('/config/ttl', protect, isAdmin, validate(updateLogTTLSchema), updateLogTTL);

router.get('/get/ttl', protect, getLogTTL);

router.get('/export', protect, isAdmin, validate(logsQuerySchema), exportAdminLogs);

router.get('/admin-cached-summary/', protect, isAdmin, getAllCachedLogSummary);

router.get('/refresh-graph', protect, refreshLogGraph);

router.get('/:userId', protect, validate(logsQuerySchema), getUserLogs);

router.get('/cached-summary/:userId', protect, validate(logsQuerySchema), getCachedLogSummary);

router.get(
  '/export/:userId',
  protect,
  isSelfOrAdmin((req) => req.params.userId as string),
  validate(logsQuerySchema),
  exportUserLogs
);

export default router;
