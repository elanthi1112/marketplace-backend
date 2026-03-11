const router = require('express').Router();
const { body } = require('express-validator');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { getOrders, getOrder, createOrder, updateOrderStatus } = require('../controllers/order.controller');

router.use(protect);

router.get('/', getOrders);
router.get('/:id', getOrder);

router.post(
  '/',
  requireRole('buyer'),
  [
    body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    body('items.*.productId').notEmpty().withMessage('Each item must have a productId'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item quantity must be at least 1'),
  ],
  createOrder
);

router.put(
  '/:id/status',
  requireRole('seller'),
  [
    body('status')
      .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Invalid status'),
  ],
  updateOrderStatus
);

module.exports = router;
