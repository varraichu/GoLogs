import express from 'express';
import { protect, isAdmin } from '../middleware/auth.middleware';
import {assignToGroups,unassignFromGroup,getAssignedGroups,getApps} from '../controllers/appGroupController'; // adjust path if needed


const router = express.Router();

// console.log(typeof assignToGroups)
router.use(protect, isAdmin);
router.get('/', getApps);
router.post('/:appId/user-groups', assignToGroups);
router.delete('/:appId/user-groups/:groupId', unassignFromGroup);
router.get('/:appId/user-groups', getAssignedGroups);

export default router;