import mongoose, { Document, Schema } from 'mongoose';

// Defines the schema for application logs, including message, type, timestamp, and auto-expiry after 30 days.

export interface ILog extends Document {
  app_id: mongoose.Types.ObjectId;
  message: string;
  timestamp: Date;
  log_type: string;
  ingested_at: Date;
}

const logSchema: Schema<ILog> = new Schema({
  app_id: { type: Schema.Types.ObjectId, ref: 'Applications', required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, required: true },
  log_type: { type: String, required: true },
  ingested_at: {
    type: Date,
    default: Date.now,
    expires: '30d', // TTL: auto-delete after 30 days
  },
});

logSchema.index({ app_id: 1 });

export default mongoose.model<ILog>('Logs', logSchema);
