import { Request, Response } from 'express';
import Application from '../models/Applications';

export const getAllApplications = async (req: Request, res: Response) => {
  try {
    const apps = await Application.find(
      { is_active: true }, 
      { _id: 1, name: 1 }   
    );

    res.status(200).json(apps);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
