import { validationResult } from 'express-validator';
import ServiceRequest from '../models/ServiceRequest';
import { Request, Response, NextFunction } from 'express';

export const getBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user._id.toString();
    const filter: any = {
      $or: [{ client: (req as any).user._id }, { professional: (req as any).user._id }],
    };
    if (req.query.status) filter.status = req.query.status;

    const bookings = await ServiceRequest.find(filter)
      .populate('client', 'name email avatar')
      .populate('professional', 'name email avatar')
      .populate('service', 'title price priceType')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

export const getBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const booking = await ServiceRequest.findById(req.params.id)
      .populate('client', 'name email avatar')
      .populate('professional', 'name email avatar')
      .populate('service', 'title price priceType');
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }
    const isClient = (booking as any).client._id.toString() === (req as any).user._id.toString();
    const isProfessional = (booking as any).professional._id.toString() === (req as any).user._id.toString();
    if (!isClient && !isProfessional) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

export const createBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      return;
    }
    const { professional, service, serviceTitle, preferredDateTime, notes, offeredPrice } = req.body;
    const booking = await ServiceRequest.create({
      client: (req as any).user._id,
      professional,
      service: service || undefined,
      serviceTitle,
      preferredDateTime,
      notes,
      offeredPrice,
    });
    await booking.populate([
      { path: 'client', select: 'name email avatar' },
      { path: 'professional', select: 'name email avatar' },
      { path: 'service', select: 'title price priceType' },
    ]);
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

export const updateBookingStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      return;
    }
    const booking = await ServiceRequest.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }
    const isClient = (booking as any).client.toString() === (req as any).user._id.toString();
    const isProfessional = (booking as any).professional.toString() === (req as any).user._id.toString();
    if (!isClient && !isProfessional) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const { status, cancelReason } = req.body;

    // Only professional can accept/reject/counter
    if (['accepted', 'rejected', 'countered'].includes(status) && !isProfessional) {
      res.status(403).json({ message: 'Only the professional can perform this action' });
      return;
    }
    // Only client or professional can cancel
    if (status === 'cancelled' && !isClient && !isProfessional) {
      res.status(403).json({ message: 'Not authorized to cancel' });
      return;
    }

    (booking as any).status = status;
    if (cancelReason) (booking as any).cancelReason = cancelReason;
    await booking.save();
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

export const counterBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      return;
    }
    const booking = await ServiceRequest.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }
    if ((booking as any).professional.toString() !== (req as any).user._id.toString()) {
      res.status(403).json({ message: 'Only the professional can counter-offer' });
      return;
    }
    const { price, proposedDateTime, notes } = req.body;
    (booking as any).counterOffer = { price, proposedDateTime, notes };
    (booking as any).status = 'countered';
    await booking.save();
    res.json(booking);
  } catch (err) {
    next(err);
  }
};
