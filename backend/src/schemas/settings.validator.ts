import { object, string, number, z } from 'zod';

// Create Settings Schema
export const createSettingsSchema = object({
  body: object({
    user_id: string({ required_error: 'User ID is required' }),
    error_rate_threshold: number({
      required_error: 'Error rate threshold is required',
    })
      .int('Must be a whole number')
      .min(1, 'Must be at least 1 log per minute')
      .max(20, 'Must be at most 20 logs per minute'),

    warning_rate_threshold: number({
      required_error: 'Warning rate threshold is required',
    })
      .int('Must be a whole number')
      .min(1, 'Must be at least 1 log per minute')
      .max(50, 'Must be at most 50 logs per minute'),

    silent_duration: number({
      required_error: 'Silent duration is required',
    })
      .int('Must be a whole number')
      .min(1, 'Must be at least 1 hour')
      .max(24, 'Must be at most 24 hours'),
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
    error_rate_threshold: number()
      .int('error_rate_threshold must be a whole number')
      .min(1, 'error_rate_threshold must be at least 1 log per minute')
      .max(20, 'error_rate_threshold must be at most 20 logs per minute')
      .optional(),
    warning_rate_threshold: number()
      .int('warning_rate_threshold must be a whole number')
      .min(1, 'warning_rate_threshold must be at least 1 log per minute')
      .max(50, 'warning_rate_threshold must be at most 50 logs per minute')
      .optional(),
    silent_duration: number()
      .int('silent_duration must be a whole number')
      .min(1, 'silent_duration must be at least 1 hour')
      .max(24, 'silent_duration must be at most 24 hours')
      .optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'Update body cannot be empty',
  }),
});

// Zod types
export type CreateSettingsInput = z.infer<typeof createSettingsSchema>['body'];
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>['body'];
export type SettingsParams = z.infer<typeof settingsParamsSchema>['params'];
