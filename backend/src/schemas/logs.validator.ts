import { object, string, boolean, z, number } from 'zod'; // Added 'number'
import config from 'config';
import { createApplicationSchema } from './application.validator';

// Extract the app name validation rule
const appNameValidation = createApplicationSchema.shape.body.shape.name;
const allowedLogTypes = ['debug', 'info', 'warn', 'error'];

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
    log_type: z
      .union([
        string().refine((val) => allowedLogTypes.includes(val), {
          message: `log_type must be one of: ${allowedLogTypes.join(', ')}`,
        }),
        z.array(
          string().refine((val) => allowedLogTypes.includes(val), {
            message: `Each log_type must be one of: ${allowedLogTypes.join(', ')}`,
          })
        ),
      ])
      .optional(),

    app_name: z.union([appNameValidation, z.array(appNameValidation)]).optional(),
    startDate: string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'startDate must be a valid ISO date string',
      }),
    endDate: string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'endDate must be a valid ISO date string',
      }),
  }),
});

// ✨ New Exported Type for Log TTL
export type UpdateLogTTLInput = z.infer<typeof updateLogTTLSchema>['body'];
export type LogsQueryInput = z.infer<typeof logsQuerySchema>['query'];
