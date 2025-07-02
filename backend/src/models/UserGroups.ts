import mongoose, { Document, Schema } from 'mongoose';

export interface IUserGroup extends Document {
  name: string;
  description: string;
  created_at: Date;
  is_deleted: boolean;
  is_active: boolean; // Optional field for future use
}

const userGroupSchema: Schema<IUserGroup> = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  is_deleted: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
});

export default mongoose.model<IUserGroup>('UserGroups', userGroupSchema);
