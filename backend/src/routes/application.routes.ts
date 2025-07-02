import express from 'express';
import { getAllApplications } from '../controllers/application.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', protect, getAllApplications);

export default router;
