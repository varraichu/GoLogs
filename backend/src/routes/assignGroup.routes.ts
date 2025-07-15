import express from 'express';
import { protect, isAdmin } from '../middleware/auth.middleware';
import {
  assignToGroups,
  unassignFromGroup,
  getAssignedGroups,
} from '../controllers/assignGroup.controller';

const router = express.Router();

router.use(protect, isAdmin);

router.post('/:appId/user-groups', assignToGroups);

router.delete('/:appId/user-groups/:groupId', unassignFromGroup);

router.get('/:appId/user-groups', getAssignedGroups);

export default router;
