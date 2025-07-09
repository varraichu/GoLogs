import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  user_id: mongoose.Types.ObjectId;
  error_rate_threshold: number;
  warning_rate_threshold: number;
  silent_duration: number;
}

const settingsSchema: Schema<ISettings> = new Schema({
  // username: { type: String, required: true, trim: true, minlength: 3, maxlength: 50 },
  user_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  error_rate_threshold: { type: Number, required: true },
  warning_rate_threshold: { type: Number, required: true },
  silent_duration: { type: Number, required: true },
});

settingsSchema.index(
  { user_id: 1 },
  {
    unique: true,
  }
);

export default mongoose.model<ISettings>('Settings', settingsSchema);
