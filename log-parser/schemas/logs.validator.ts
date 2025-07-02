import { object, string, z } from 'zod';
import mongoose from 'mongoose';

export const insertLogToDBSchema = object({
  body: object({
    app_id: z.string().refine((val) => {
      return mongoose.Types.ObjectId.isValid(val);
    }, {
      message: 'Invalid App ID',
    }),
    app_name: string({ required_error: 'App Name is required' }).min(
      3,
      'Name must be at least 3 characters long'
    ),
    message: string({ required_error: 'Log Message is required' }).min(
      5,
      'Log message must be at least 5 characters long'
    ),
    log_type: string({ required_error: 'Log Type is required' }),
    timestamp: z.coerce.date(),
    ingested_at: z.coerce.date(),
  }),
});

export type InsertLogToDBInput = z.infer<typeof insertLogToDBSchema>['body'];