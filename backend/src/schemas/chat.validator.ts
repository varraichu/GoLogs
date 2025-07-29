import { z } from 'zod';

export const chatSchema = z.object({
  body: z.object({
    query: z.string().min(1).max(4000),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
