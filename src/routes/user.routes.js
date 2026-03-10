const router = require('express').Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth.middleware');
const { getMe, updateMe } = require('../controllers/user.controller');

router.use(protect);

router.get('/me', getMe);
router.put(
  '/me',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
  ],
  updateMe
);

module.exports = router;
