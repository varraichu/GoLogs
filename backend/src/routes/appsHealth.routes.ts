import express from 'express';
import { getAppsHealthHandler } from '../controllers/appsHealth.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();
router.get('/summary', protect, getAppsHealthHandler);
export default router;
