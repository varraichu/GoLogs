import mongoose, { Document, Schema } from 'mongoose';

// Defines the schema for users, including username, email, profile picture, and pinned applications

export interface IUser extends Document {
  username: string;
  email: string;
  picture_url?: string;
  pinned_apps: mongoose.Types.ObjectId[];
}

const userSchema: Schema<IUser> = new Schema({
  username: { type: String, required: true, trim: true, minlength: 3, maxlength: 50 },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@gosaas\.io$/, 'Email must be a valid @gosaas.io address'],
  },
  picture_url: { type: String, default: '' },
  pinned_apps: [{ type: Schema.Types.ObjectId, ref: 'Applications' }],
});

export default mongoose.model<IUser>('Users', userSchema);
