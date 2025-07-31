import { z } from 'zod';

// Validation schema for adding a prompt
export const addPromptSchema = z.object({
  body: z.object({
    prompt: z
      .string()
      .min(1, 'Prompt cannot be empty')
      .max(5000, 'Prompt cannot exceed 5000 characters')
      .trim(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

// Validation schema for routes with prompt ID parameter
export const promptIdSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid prompt ID format'),
  }),
});
