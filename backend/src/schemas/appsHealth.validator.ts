import { z } from 'zod';
import mongoose from 'mongoose';

export const MonitoringQuerySchema = z.object({
  userId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: 'Invalid MongoDB ObjectId',
  }),
});
