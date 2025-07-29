import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { validate } from '../middleware/validate.middleware';
import { chatSchema } from '../schemas/chat.validator';
import { isAdmin, protect } from '../middleware/auth.middleware';

const router = Router();
const chatController = new ChatController();

router.post('/',protect, isAdmin, validate(chatSchema), async (req, res, next) => {
  await chatController.handleChatQuery(req, res, next);
});

// Cleanup handler for graceful shutdown
process.on('SIGTERM', async () => {
  await chatController.cleanup();
});

export default router;
