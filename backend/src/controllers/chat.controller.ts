import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chatbot/chat.service';

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  async handleChatQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = req.body;
      const response = await this.chatService.processQuery(query);
      res.json({ response });
    } catch (error) {
      next(error);
    }
  }

  async cleanup() {
    await this.chatService.cleanup();
  }
}
