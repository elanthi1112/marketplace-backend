import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.middleware';
import { getConversations, getMessages, sendMessage } from '../controllers/message.controller';

const router = Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/conversations/:conversationId', getMessages);

router.post(
  '/',
  [
    body('content').notEmpty().withMessage('Message content is required'),
  ],
  sendMessage
);

export default router;
