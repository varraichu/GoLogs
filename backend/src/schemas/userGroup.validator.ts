import { object, string, z, boolean, array } from 'zod';
import config from 'config';

export const createUserGroupSchema = object({
  body: object({
    name: string({ required_error: 'Name is required' })
      .min(3, 'Name must be at least 3 characters long')
      .max(10, 'Name must not exceed 10 characters'),
    description: string({ required_error: 'Description is required' })
      .min(5, 'Description must be at least 5 characters long')
      .max(50, 'Description must not exceed 50 characters'),
    memberEmails: array(string().email('Invalid email format in member list'))
      .optional()
      .default([]),
  }).refine((data) => data.name !== config.get('admin_group_name'), {
    message: `Name cannot be ${config.get('admin_group_name')}`,
  }),
});

const params = {
  params: object({
    groupId: string({ required_error: 'Group ID is required' }),
  }),
};

export const userGroupParamsSchema = object({
  ...params,
});

export const updateUserGroupSchema = object({
  ...params,
  body: object({
    name: string()
      .min(3, 'Name must be at least 3 characters long')
      .max(10, 'Name must not exceed 10 characters')
      .optional(),
    description: string()
      .min(5, 'Description must be at least 5 characters long')
      .max(50, 'Description must not exceed 50 characters')
      .optional(),
    addMemberEmails: array(
      string().email('Invalid email format in addMemberEmails list')
    ).optional(),
    removeMemberEmails: array(
      string().email('Invalid email format in removeMemberEmails list')
    ).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'Update body cannot be empty',
  }),
});

export const userGroupStatusSchema = object({
  ...params,
  body: object({
    is_active: boolean(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'Body must include status of the usergroup.',
  }),
});

export type CreateUserGroupInput = z.infer<typeof createUserGroupSchema>['body'];
export type UpdateUserGroupInput = z.infer<typeof updateUserGroupSchema>['body'];
export type userGroupStatusInput = z.infer<typeof userGroupStatusSchema>['body'];
export type UserGroupParams = z.infer<typeof userGroupParamsSchema>['params'];
