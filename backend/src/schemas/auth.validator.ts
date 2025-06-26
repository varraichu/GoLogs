import { object, string, z } from 'zod';

export const googleOauthCallbackSchema = object({
  query: object({
    code: string({
      required_error: 'Google authorization code is required',
    }),
    state: string().optional(), // Often used for CSRF protection
  }),
});

export type GoogleOauthCallbackInput = z.infer<typeof googleOauthCallbackSchema>['query'];
