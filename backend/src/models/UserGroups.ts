import mongoose, { Document, Schema } from 'mongoose';

// Defines the schema for user groups, including metadata fields and unique constraints

export interface IUserGroup extends Document {
  name: string;
  description: string;
  created_at: Date;
  is_deleted: boolean;
  is_active: boolean; // Optional field for future use
}

const userGroupSchema: Schema<IUserGroup> = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  created_at: { type: Date, default: Date.now },
  is_deleted: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
});

userGroupSchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: { is_deleted: false }, // only enforces uniqueness if not deleted
  }
);

export default mongoose.model<IUserGroup>('UserGroups', userGroupSchema);
