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

export const logsQuerySchema = object({
  query: object({
    page: string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1))
      .refine((val) => val > 0, { message: 'Page must be a positive number' }),
    limit: string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 20))
      .refine((val) => val > 0 && val <= 100, { message: 'Limit must be between 1 and 100' }),
    sort: string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true;

          // Validate sort format: "field:direction,field:direction"
          const sortItems = val.split(',');
          const validFields = ['timestamp', 'log_type', 'app_name', 'message', 'ingested_at'];
          const validDirections = ['asc', 'desc'];

          return sortItems.every((item) => {
            const [field, direction] = item.split(':');
            return (
              validFields.includes(field?.trim()) && validDirections.includes(direction?.trim())
            );
          });
        },
        {
          message:
            'Sort format must be "field:direction,field:direction". Valid fields: timestamp, log_type, app_name, message, ingested_at. Valid directions: asc, desc',
        }
      ),
  }),
});

// ✨ New Exported Type for Log TTL
export type UpdateLogTTLInput = z.infer<typeof updateLogTTLSchema>['body'];
export type LogsQueryInput = z.infer<typeof logsQuerySchema>['query'];
