import mongoose, { Document, Schema } from 'mongoose';

// Defines the schema for prompts
export interface IPrompt extends Document {
  prompt: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const promptSchema: Schema<IPrompt> = new Schema(
  {
    prompt: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 5000, // Adjust based on your needs
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

export default mongoose.model<IPrompt>('Prompts', promptSchema);
