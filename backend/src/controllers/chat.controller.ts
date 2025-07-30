import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chatbot/chat.service';

// Extend the Request interface to include user properties
interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    email: string;
    isAdmin: boolean;
  };
}

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  async handleChatQuery(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { query } = req.body;

      // Access admin state - this will be set by the protect middleware
      const userId = req.user?._id; // ✅ correct property
      const isAdmin = req.user?.isAdmin || false; // ✅ also fix this line

      const response = await this.chatService.processQuery(query, userId, isAdmin);
      res.json({ response });
    } catch (error) {
      next(error);
    }
  }

  async cleanup() {
    await this.chatService.cleanup();
  }
}
