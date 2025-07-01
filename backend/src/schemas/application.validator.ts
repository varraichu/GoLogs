import { object, string, boolean, z, array } from 'zod';
import config from 'config';

export const createApplicationSchema = object({
  body: object({
    name: string({ required_error: 'Name is required' })
      .min(3, 'Name must be at least 3 characters long')
      .regex(/^[^\s]+$/, 'Name cannot contain spaces'),
    description: string({ required_error: 'Description is required' }).min(
      5,
      'Description must be at least 5 characters long'
    ),
  }),
});

const params = {
  params: object({
    appId: string({ required_error: 'App ID is required' }),
  }),
};

export const applicationParamsSchema = object({
  ...params,
});

// export const updateApplicationSchema = object({
//   ...params,
//   body: object({
//     name: string().min(3, 'Name must be at least 3 characters long').optional(),
//     description: string().min(5, 'Description must be at least 5 characters long').optional(),
//     addMemberEmails: array(
//       string().email('Invalid email format in addMemberEmails list')
//     ).optional(),
//     removeMemberEmails: array(
//       string().email('Invalid email format in removeMemberEmails list')
//     ).optional(),
//   }).refine((data) => Object.keys(data).length > 0, {
//     message: 'Update body cannot be empty',
//   }),
// });

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>['body'];
// export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>['body'];
export type ApplicationParams = z.infer<typeof applicationParamsSchema>['params'];
