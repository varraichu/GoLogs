import mongoose, { Document, Schema } from 'mongoose';

export interface IUserGroup extends Document {
  name: string;
  description: string;
  created_at: Date;
  is_deleted: boolean;
}

const userGroupSchema: Schema<IUserGroup> = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  created_at: { type: Date, default: Date.now },
  is_deleted: { type: Boolean, default: false },
});

userGroupSchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: { is_deleted: false }, // only enforces uniqueness if not deleted
  }
);

export default mongoose.model<IUserGroup>('UserGroups', userGroupSchema);
