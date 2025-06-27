import express from 'express';
import { protect, isAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware'; // Assuming you have this middleware
import {
  createUserGroupSchema,
  updateUserGroupSchema,
  userGroupParamsSchema,
} from '../schemas/userGroup.validator';
import {
  createUserGroup,
  getAllUserGroups,
  getUserGroupById,
  updateUserGroup,
  deleteUserGroup,
} from '../controllers/userGroup.controller';

const router = express.Router();

router.use(protect, isAdmin);

router.get('/', getAllUserGroups);
router.post('/', validate(createUserGroupSchema), createUserGroup);

router.get('/:groupId', validate(userGroupParamsSchema), getUserGroupById);
router.patch('/:groupId', validate(updateUserGroupSchema), updateUserGroup); // PATCH is semantically better for partial updates
router.delete('/:groupId', validate(userGroupParamsSchema), deleteUserGroup);

export default router;
