import express from 'express';
import {assignToGroups,unassignFromGroup,getAssignedGroups} from '../controllers/appGroupController'; // adjust path if needed


const router = express.Router();

console.log(typeof assignToGroups)
router.post('/:appId/user-groups', assignToGroups);
router.delete('/:appId/user-groups/:groupId', unassignFromGroup);
router.get('/:appId/user-groups', getAssignedGroups);

export default router;