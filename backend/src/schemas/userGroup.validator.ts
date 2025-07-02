import { object, string, z, array } from 'zod';
import config from 'config';

export const createUserGroupSchema = object({
  body: object({
    name: string({ required_error: 'Name is required' })
      .min(5, 'Name must be at least 5 characters long')
      .max(20, 'Name must be at most 50 characters long'),

    description: string({ required_error: 'Description is required' })
      .min(10, 'Description must be at least 10 characters long')
      .max(100, 'Description must be at most 100 characters long'),

    memberEmails: array(string().email('Invalid email format in member list'))
      .min(1, 'At least one member email is required')
      .max(100, 'You can add up to 100 member emails only'),
  }).refine((data) => data.name !== config.get('admin_group_name'), {
    message: `Name cannot be ${config.get('admin_group_name')}`,
    path: ['name'],
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
      .max(20, 'Name must be at most 50 characters long')
      .optional(),
    description: string()
      .min(5, 'Description must be at least 5 characters long')
      .max(100, 'Description must be at most 100 characters long')
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

export type CreateUserGroupInput = z.infer<typeof createUserGroupSchema>['body'];
export type UpdateUserGroupInput = z.infer<typeof updateUserGroupSchema>['body'];
export type UserGroupParams = z.infer<typeof userGroupParamsSchema>['params'];
