export interface UserPayload {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | string;
  picture_url?: string;
  pinned_apps?: string[];
}
