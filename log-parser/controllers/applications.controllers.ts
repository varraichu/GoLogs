import Application from '../models/applications';
import mongoose from 'mongoose';

export const getApplicationIdByName = async (appName: string): Promise<mongoose.Types.ObjectId> => {
  const app = await Application.findOne({ name: appName }).exec();
  if (!app) throw new Error(`Application with name "${appName}" not found`);
  console.error('Resolved app_id:', app._id, typeof app._id);
  return app._id as mongoose.Types.ObjectId;
};