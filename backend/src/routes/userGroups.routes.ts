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
  updateUserGroupAppAccess,
  toggleGroupStatus,
} from '../controllers/userGroup.controller';
import UserGroupMembers from '../models/UserGroupMembers';

const router = express.Router();

router.use(protect, isAdmin);

router.get('/', getAllUserGroups);
router.post('/', validate(createUserGroupSchema), createUserGroup);

router.get('/:groupId', validate(userGroupParamsSchema), getUserGroupById);
router.patch('/:groupId', validate(updateUserGroupSchema), updateUserGroup);
router.patch('/status/:groupId', validate(userGroupStatusSchema), toggleGroupStatus);
router.delete('/:groupId', validate(userGroupParamsSchema), deleteUserGroup);

router.patch('/:groupId/app-access', updateUserGroupAppAccess);

router.get('/:groupId/users', async (req, res) => {
  try {
    const { groupId } = req.params;

    const members = await UserGroupMembers.find({ group_id: groupId, is_active: true }).populate(
      'user_id',
      'email username picture_url'
    ); // Populate user details

    const users = members.map((member) => member.user_id);

    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching group users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

export default router;
