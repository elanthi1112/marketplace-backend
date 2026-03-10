const router = require('express').Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth.middleware');
const { getMe, updateMe, switchRole } = require('../controllers/user.controller');

router.use(protect);

router.get('/me', getMe);
router.put(
  '/me',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().isString().withMessage('Invalid phone'),
  ],
  updateMe
);

router.put(
  '/me/role',
  [
    body('role').isIn(['user', 'professional']).withMessage('Role must be user or professional'),
  ],
  switchRole
);

module.exports = router;
