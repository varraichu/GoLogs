import express from 'express';
import { protect, isAdmin, isSelfOrAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { settingsParamsSchema, updateSettingsSchema } from '../schemas/settings.validator';

import { getSettingsById, updateSettingsController } from '../controllers/settings.controller';

const router = express.Router();

// Settings are user-specific — protect route but only admin can fetch/update others
router.get(
  '/:user_id',
  protect,
  isSelfOrAdmin((req) => req.params.user_id as string),
  validate(settingsParamsSchema),
  getSettingsById
);

router.patch(
  '/:user_id',
  protect,
  isSelfOrAdmin((req) => req.params.user_id as string),
  validate(updateSettingsSchema),
  updateSettingsController
);

export default router;
