import { Request, Response, NextFunction } from 'express';
import Prompts, { IPrompt } from '../models/Prompts';

// Extend the Request interface to include user properties (if needed)
interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    email: string;
    isAdmin: boolean;
  };
}

export class PromptsController {
  // Add a new prompt
  async addPrompt(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { prompt } = req.body;
      const userId = req.user?._id || '64cfe95a1234567890abcdef';

      if (!userId) {
        res.status(401).json({
          error: 'User authentication required',
        });
        return;
      }

      if (!prompt || prompt.trim().length === 0) {
        res.status(400).json({
          error: 'Prompt is required and cannot be empty',
        });
        return;
      }

      const newPrompt = new Prompts({
        prompt: prompt.trim(),
        userId: userId,
      });

      const savedPrompt = await newPrompt.save();

      res.status(201).json({
        message: 'Prompt added successfully',
        prompt: savedPrompt,
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove a prompt by ID
  async removePrompt(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id || '64cfe95a1234567890abcdef';

      if (!userId) {
        res.status(401).json({
          error: 'User authentication required',
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          error: 'Prompt ID is required',
        });
        return;
      }

      // Only allow users to delete their own prompts
      const deletedPrompt = await Prompts.findOneAndDelete({
        _id: id,
        userId: userId,
      });

      if (!deletedPrompt) {
        res.status(404).json({
          error: 'Prompt not found or you do not have permission to delete it',
        });
        return;
      }

      res.json({
        message: 'Prompt removed successfully',
        prompt: deletedPrompt,
      });
    } catch (error) {
      next(error);
    }
  }

  // Optional: Get all prompts (user's own prompts only)
  async getAllPrompts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id || '64cfe95a1234567890abcdef';

      if (!userId) {
        res.status(401).json({
          error: 'User authentication required',
        });
        return;
      }

      const prompts = await Prompts.find({ userId: userId }).sort({ createdAt: -1 });

      res.json({
        prompts,
        count: prompts.length,
      });
    } catch (error) {
      next(error);
    }
  }

  // Optional: Get a single prompt by ID (user's own prompt only)
  async getPromptById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id || '64cfe95a1234567890abcdef';

      if (!userId) {
        res.status(401).json({
          error: 'User authentication required',
        });
        return;
      }

      const prompt = await Prompts.findOne({ _id: id, userId: userId });

      if (!prompt) {
        res.status(404).json({
          error: 'Prompt not found or you do not have permission to view it',
        });
        return;
      }

      res.json({ prompt });
    } catch (error) {
      next(error);
    }
  }
}
