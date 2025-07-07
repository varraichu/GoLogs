import { object, string, number, z } from 'zod';

// Create Settings Schema
export const createSettingsSchema = object({
  body: object({
    user_id: string({ required_error: 'User ID is required' }),
    error_rate_threshold: number({
      required_error: 'Error rate threshold is required',
    }).min(1, 'Must be at least 1 log per minute'),

    warning_rate_threshold: number({
      required_error: 'Warning rate threshold is required',
    }).min(1, 'Must be at least 1 log per minute'),

    silent_duration: number({
      required_error: 'Silent duration is required',
    }).min(1, 'Must be at least 1 minute'),
  }),
});

// Settings ID param schema
export const settingsParamsSchema = object({
  params: object({
    user_id: string({ required_error: 'User ID is required' }),
  }),
});

// Update Settings Schema
export const updateSettingsSchema = object({
  ...settingsParamsSchema.shape,
  body: object({
    error_rate_threshold: number().min(1).optional(),
    warning_rate_threshold: number().min(1).optional(),
    silent_duration: number().min(1).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'Update body cannot be empty',
  }),
});

// Zod types
export type CreateSettingsInput = z.infer<typeof createSettingsSchema>['body'];
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>['body'];
export type SettingsParams = z.infer<typeof settingsParamsSchema>['params'];
