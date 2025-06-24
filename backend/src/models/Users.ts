import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  role: string;
  picture_url: string;
  pinned_apps: mongoose.Types.ObjectId[];
}

const userSchema: Schema<IUser> = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  picture_url: { type: String },
  pinned_apps: [{ type: Schema.Types.ObjectId, ref: 'Applications' }]
});

export default mongoose.model<IUser>('Users', userSchema);
