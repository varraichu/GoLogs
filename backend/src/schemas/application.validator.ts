import { object, string, boolean, z, array } from 'zod';
import config from 'config';

export const createApplicationSchema = object({
  body: object({
    name: string({ required_error: 'Name is required' })
      .min(3, 'Name must be at least 3 characters long')
      .regex(/^[A-Za-z0-9_]+$/, 'Only letters, numbers, and underscores are allowed'),
    description: string()
      .min(5, 'Description must be at least 5 characters long')
      .max(50, 'Description must not exceed 100 characters'),
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

export const updateApplicationSchema = object({
  ...params,
  body: object({
    name: string({ required_error: 'Name is required' })
      .min(3, 'Name must be at least 3 characters long')
      .regex(/^[A-Za-z0-9_]+$/, 'Only letters, numbers, and underscores are allowed')
      .optional(),
    description: string()
      .min(5, 'Description must be at least 5 characters long')
      .max(50, 'Description must not exceed 100 characters')
      .optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'Update body cannot be empty',
  }),
});

export const applicationStatusSchema = object({
  ...params,
  body: object({
    is_active: boolean(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'Body must include status of the application.',
  }),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>['body'];
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>['body'];
export type applicationStatusInput = z.infer<typeof applicationStatusSchema>['body'];
export type ApplicationParams = z.infer<typeof applicationParamsSchema>['params'];
