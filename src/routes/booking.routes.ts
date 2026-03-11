import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.middleware';
import { getBookings, getBooking, createBooking, updateBookingStatus, counterBooking } from '../controllers/booking.controller';

const router = Router();

router.use(protect);

router.get('/', getBookings);
router.get('/:id', getBooking);

router.post(
  '/',
  [
    body('professional').notEmpty().withMessage('Professional ID is required'),
    body('serviceTitle').notEmpty().withMessage('Service title is required'),
  ],
  createBooking
);

router.put(
  '/:id/status',
  [
    body('status')
      .isIn(['accepted', 'rejected', 'cancelled', 'completed'])
      .withMessage('Invalid status'),
  ],
  updateBookingStatus
);

router.put(
  '/:id/counter',
  [
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be non-negative'),
  ],
  counterBooking
);

export default router;
