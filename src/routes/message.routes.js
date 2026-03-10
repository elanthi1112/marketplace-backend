const router = require('express').Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth.middleware');
const { getConversations, getMessages, sendMessage } = require('../controllers/message.controller');

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

module.exports = router;
