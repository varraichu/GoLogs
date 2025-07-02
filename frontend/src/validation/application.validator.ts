import { z } from 'zod';

export const applicationFormSchema = z.object({
  name: z.string({ required_error: 'Name is required' })
    .min(3, 'Name must be at least 3 characters long')
    .max(10, 'Name must not exceed 10 characters')
    .regex(/^[A-Za-z0-9_]+$/, 'Only letters, numbers, and underscores are allowed'),
  description: z.string()
    .min(5, 'Description must be at least 5 characters long')
    .max(50, 'Description must not exceed 50 characters'),
});

export type ApplicationFormInput = z.infer<typeof applicationFormSchema>;
