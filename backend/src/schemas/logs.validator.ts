import { object, string, boolean, z, number } from 'zod'; // Added 'number'
import config from 'config';

// ✨ New Schema for Log TTL Update
export const updateLogTTLSchema = object({
  body: object({
    newTTLInDays: number({
      required_error: 'newTTLInDays is required',
      invalid_type_error: 'newTTLInDays must be a number',
    }).positive('newTTLInDays must be a positive number'),
  }),
});

// ✨ New Exported Type for Log TTL
export type UpdateLogTTLInput = z.infer<typeof updateLogTTLSchema>['body'];
