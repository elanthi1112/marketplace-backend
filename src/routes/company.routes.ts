import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.middleware';
import {
  getCompanies, getCompany, createCompany, updateCompany, addProfessional, removeProfessional,
} from '../controllers/company.controller';

const router = Router();

// Public routes
router.get('/', getCompanies);
router.get('/:id', getCompany);

// Protected routes
router.post(
  '/',
  protect,
  [
    body('name').notEmpty().withMessage('Company name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  createCompany
);

router.put(
  '/:id',
  protect,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
  ],
  updateCompany
);

router.post('/:id/professionals', protect, addProfessional);
router.delete('/:id/professionals/:profId', protect, removeProfessional);

export default router;
