import mongoose, { Document, Schema } from 'mongoose';

export interface ILogSummary extends Document {
  app_id: mongoose.Types.ObjectId;
  app_name: string;
  total: number;
  debug?: number;
  info?: number;
  warn?: number;
  error?: number;
  generated_at: Date;
}

const logSummarySchema: Schema<ILogSummary> = new Schema(
  {
    app_id: { type: Schema.Types.ObjectId, ref: 'Applications', required: true },
    app_name: { type: String, required: true },
    total: { type: Number, required: true },
    debug: { type: Number, default: 0 },
    info: { type: Number, default: 0 },
    warn: { type: Number, default: 0 },
    error: { type: Number, default: 0 },
    generated_at: { type: Date, default: Date.now },
  },
  {
    collection: 'log_summaries',
    timestamps: false,
  }
);

export default mongoose.model<ILogSummary>('LogSummary', logSummarySchema);
