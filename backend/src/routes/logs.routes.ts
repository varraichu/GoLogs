import express from 'express';
import { protect, isAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

import { getAllLogs } from '../controllers/logs.controllers';

const router = express.Router();

router.get('/', protect, isAdmin, getAllLogs);
// router.get('/', protect, getAllLogs);

// router.patch('/:appId', validate(updateApplicationSchema), updateApplication);
// router.patch('/status/:appId', validate(applicationStatusSchema), toggleApplicationStatus);
// router.delete('/:appId', validate(applicationParamsSchema), deleteApplication);

export default router;
