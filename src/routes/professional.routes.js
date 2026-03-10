const router = require('express').Router();
const { body } = require('express-validator');
const { protect, requireRole } = require('../middleware/auth.middleware');
const {
  getProfessionals, getProfessional, getMyProfile, upsertProfile, submitVerification,
} = require('../controllers/professional.controller');

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

module.exports = router;
