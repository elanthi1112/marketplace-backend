const router = require('express').Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth.middleware');
const {
  getCompanies, getCompany, createCompany, updateCompany, addProfessional, removeProfessional,
} = require('../controllers/company.controller');

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

module.exports = router;
