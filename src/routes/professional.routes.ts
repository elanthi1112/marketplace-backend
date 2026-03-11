import { Router } from 'express';
import { body } from 'express-validator';
import { protect, requireRole } from '../middleware/auth.middleware';
import {
  getProfessionals, getProfessional, getMyProfile, upsertProfile, submitVerification,
} from '../controllers/professional.controller';

const router = Router();

// Public routes
router.get('/', getProfessionals);
router.get('/:userId', getProfessional);

// Protected routes (professional only)
router.get('/me/profile', protect, requireRole('professional'), getMyProfile);

router.put(
  '/me/profile',
  protect,
  requireRole('professional'),
  [
    body('profession').optional().notEmpty().withMessage('Profession cannot be empty'),
    body('yearsOfExperience').optional().isInt({ min: 0 }).withMessage('Years must be non-negative'),
    body('serviceRadiusKm').optional().isFloat({ min: 0 }).withMessage('Radius must be non-negative'),
    body('lat').optional().isFloat().withMessage('Invalid latitude'),
    body('lng').optional().isFloat().withMessage('Invalid longitude'),
  ],
  upsertProfile
);

router.post(
  '/me/verify',
  protect,
  requireRole('professional'),
  submitVerification
);

export default router;
