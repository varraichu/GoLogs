import express from 'express';
import { protect, isAdmin } from '../middleware/auth.middleware';
import { searchDirectory } from '../controllers/directory.controller';

const router = express.Router();

// GET /api/directory/search?q=...
router.get('/search', protect, isAdmin, searchDirectory);

export default router;
