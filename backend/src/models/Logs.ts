import mongoose, { Document, Schema } from 'mongoose';

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
    expires: '30d' // TTL: auto-delete after 30 days
  }
});

export default mongoose.model<ILog>('Logs', logSchema);
