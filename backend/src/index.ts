import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
app.use(express.json());

const MONGO_URI = process.env.MONGODB_URI as string;

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

app.get('/', (req: Request, res: Response) => {
  res.send('🚀 GoLogs API is running');
});

app.listen(3000, () => {
  console.log('🔌 Server is listening at http://localhost:3000');
});
