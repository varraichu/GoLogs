import { z } from 'zod';

export const userGroupFormSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters long')
    .max(10, 'Name must not exceed 10 characters')
    .optional(),
  description: z.string()
    .min(5, 'Description must be at least 5 characters long')
    .max(50, 'Description must not exceed 50 characters')
    .optional(),
});

export type UserGroupFormInput = z.infer<typeof userGroupFormSchema>;
