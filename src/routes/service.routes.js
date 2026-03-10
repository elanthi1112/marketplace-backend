const router = require('express').Router();
const { body } = require('express-validator');
const { protect, requireRole } = require('../middleware/auth.middleware');
const {
  getServices, getService, createService, updateService, deleteService,
} = require('../controllers/service.controller');

router.get('/', getServices);
router.get('/:id', getService);

router.post(
  '/',
  protect,
  requireRole('professional'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('priceType').optional().isIn(['hourly', 'fixed', 'from']).withMessage('Invalid price type'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  createService
);

router.put(
  '/:id',
  protect,
  requireRole('professional'),
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be non-negative'),
    body('priceType').optional().isIn(['hourly', 'fixed', 'from']).withMessage('Invalid price type'),
  ],
  updateService
);

router.delete('/:id', protect, requireRole('professional'), deleteService);

module.exports = router;
