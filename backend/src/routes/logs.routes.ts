import express from 'express';
import { protect, isAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

import { getAllLogs, getLogTTL, getUserLogs, updateLogTTL } from '../controllers/logs.controller';
import { updateLogTTLSchema, logsQuerySchema } from '../schemas/logs.validator';

const router = express.Router();

router.get('/', protect, isAdmin, validate(logsQuerySchema), getAllLogs);
// router.get('/', validate(logsQuerySchema), getAllLogs);

router.get('/:userId', validate(logsQuerySchema), getUserLogs);
router.patch(
  '/config/ttl',
  protect,
  isAdmin,
  validate(updateLogTTLSchema), // Using the new schema
  updateLogTTL
);

router.get('/get/ttl', getLogTTL);
// router.patch(
//   '/config/ttl',
//   validate(updateLogTTLSchema), // Using the new schema
//   updateLogTTL
// );

// router.get('/', protect, getAllLogs);
export default router;
