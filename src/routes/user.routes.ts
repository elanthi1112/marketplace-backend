import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.middleware';
import { getMe, updateMe, switchRole } from '../controllers/user.controller';

const router = Router();

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

export default router;
