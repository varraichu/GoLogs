import mongoose, { Document, Schema } from 'mongoose';

export interface IUserGroupMember extends Document {
  user_id: mongoose.Types.ObjectId;
  group_id: mongoose.Types.ObjectId;
  is_active: boolean;
}

const userGroupMemberSchema: Schema<IUserGroupMember> = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  group_id: { type: Schema.Types.ObjectId, ref: 'UserGroups', required: true },
  is_active: { type: Boolean, default: true },
});

userGroupMemberSchema.index({ user_id: 1, group_id: 1 }, { unique: true });

export default mongoose.model<IUserGroupMember>('UserGroupMembers', userGroupMemberSchema);
