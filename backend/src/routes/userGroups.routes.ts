import express from 'express';
import { protect, isAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createUserGroupSchema,
  updateUserGroupSchema,
  userGroupParamsSchema,
  userGroupStatusSchema,
} from '../schemas/userGroup.validator';
import {
  createUserGroup,
  getAllUserGroups,
  getUserGroupById,
  updateUserGroup,
  deleteUserGroup,
  toggleGroupStatus,
} from '../controllers/userGroup.controller';

const router = express.Router();

// router.use(protect, isAdmin);

router.get('/', getAllUserGroups);
router.post('/', validate(createUserGroupSchema), createUserGroup);

router.get('/:groupId', validate(userGroupParamsSchema), getUserGroupById);
router.patch('/:groupId', validate(updateUserGroupSchema), updateUserGroup);
router.patch('/status/:groupId', validate(userGroupStatusSchema), toggleGroupStatus);
router.delete('/:groupId', validate(userGroupParamsSchema), deleteUserGroup);

export default router;
