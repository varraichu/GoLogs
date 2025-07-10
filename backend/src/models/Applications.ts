import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  name: string;
  description: string;
  created_at: Date;
  is_deleted: boolean;
  is_active: boolean;
}

const applicationSchema: Schema<IApplication> = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  created_at: { type: Date, default: Date.now },
  is_deleted: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
});

export default mongoose.model<IApplication>('Applications', applicationSchema);
