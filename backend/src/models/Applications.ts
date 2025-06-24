import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  name: string;
  description: string;
  created_at: Date;
  is_active: boolean;
}

const applicationSchema: Schema<IApplication> = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true },
});

export default mongoose.model<IApplication>('Applications', applicationSchema);
