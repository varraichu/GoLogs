import { object, string, boolean, z, number } from 'zod'; // Added 'number'
import config from 'config';

// ✨ New Schema for Log TTL Update
export const updateLogTTLSchema = object({
  body: object({
    newTTLInDays: number({
      required_error: 'newTTLInDays is required',
      invalid_type_error: 'newTTLInDays must be a number',
    }).refine( (num)=> [1,7,14,30].includes(num),"newTTLInDays must be one of: 1, 7, 14, or 30"),
  }),
});

// ✨ New Exported Type for Log TTL
export type UpdateLogTTLInput = z.infer<typeof updateLogTTLSchema>['body'];
