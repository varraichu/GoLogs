import mongoose, { Document, Schema } from 'mongoose';

export interface IUserGroupApplication extends Document {
  app_id: mongoose.Types.ObjectId;
  group_id: mongoose.Types.ObjectId;
  is_active: boolean;
}

const userGroupApplicationSchema: Schema<IUserGroupApplication> = new Schema({
  app_id: { type: Schema.Types.ObjectId, ref: 'Applications', required: true },
  group_id: { type: Schema.Types.ObjectId, ref: 'UserGroups', required: true },
  is_active: { type: Boolean, default: true },
});

export default mongoose.model<IUserGroupApplication>(
  'UserGroupApplications',
  userGroupApplicationSchema
);
