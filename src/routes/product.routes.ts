const router = require('express').Router();
const { body } = require('express-validator');
const { protect, requireRole } = require('../middleware/auth.middleware');
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
} = require('../controllers/product.controller');

router.get('/', getProducts);
router.get('/:id', getProduct);

router.post(
  '/',
  protect,
  requireRole('seller'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('category').notEmpty().withMessage('Category is required'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  ],
  createProduct
);

router.put(
  '/:id',
  protect,
  requireRole('seller'),
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be non-negative'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be non-negative'),
  ],
  updateProduct
);

router.delete('/:id', protect, requireRole('seller'), deleteProduct);

module.exports = router;
