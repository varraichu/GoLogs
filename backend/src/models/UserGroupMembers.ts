import mongoose, { Document, Schema } from 'mongoose';

// Defines the schema for user group members, linking users to groups with status fields

export interface IUserGroupMember extends Document {
  user_id: mongoose.Types.ObjectId;
  group_id: mongoose.Types.ObjectId;
  is_active: boolean;
  is_removed: boolean;
}

const userGroupMemberSchema: Schema<IUserGroupMember> = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  group_id: { type: Schema.Types.ObjectId, ref: 'UserGroups', required: true },
  is_active: { type: Boolean, default: true },
  is_removed: { type: Boolean, default: false },
});

userGroupMemberSchema.index({ user_id: 1, group_id: 1 }, { unique: true });

export default mongoose.model<IUserGroupMember>('UserGroupMembers', userGroupMemberSchema);
