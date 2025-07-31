import { Router } from 'express';
import { PromptsController } from '../controllers/prompts.controller';
import { validate } from '../middleware/validate.middleware';
import { addPromptSchema, promptIdSchema } from '../schemas/prompts.validator';
import { protect } from '../middleware/auth.middleware';

const router = Router();
const promptsController = new PromptsController();

// Protected routes - require authentication
// Add a new prompt
router.post(
  '/',
  protect,
  validate(addPromptSchema),
  promptsController.addPrompt.bind(promptsController)
);

// Remove a prompt by ID
router.delete(
  '/:id',
  protect,
  validate(promptIdSchema),
  promptsController.removePrompt.bind(promptsController)
);

// Optional: Get all prompts
router.get('/', protect, promptsController.getAllPrompts.bind(promptsController));
// router.get('/', promptsController.getAllPrompts.bind(promptsController));

// Optional: Get a single prompt by ID
router.get(
  '/:id',
  protect,
  validate(promptIdSchema),
  promptsController.getPromptById.bind(promptsController)
);

export default router;
