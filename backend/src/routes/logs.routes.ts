import express from 'express';
import { protect, isAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

import { getAllLogs, getUserLogs } from '../controllers/logs.controller';

const router = express.Router();

router.get('/', protect, isAdmin, getAllLogs);
router.get('/:userId', getUserLogs);
// router.get('/', protect, getAllLogs);
export default router;
