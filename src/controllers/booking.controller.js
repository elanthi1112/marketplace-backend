const { validationResult } = require('express-validator');
const ServiceRequest = require('../models/ServiceRequest');

const getBookings = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const filter = {
      $or: [{ client: req.user._id }, { professional: req.user._id }],
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

const getBooking = async (req, res, next) => {
  try {
    const booking = await ServiceRequest.findById(req.params.id)
      .populate('client', 'name email avatar')
      .populate('professional', 'name email avatar')
      .populate('service', 'title price priceType');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const isClient = booking.client._id.toString() === req.user._id.toString();
    const isProfessional = booking.professional._id.toString() === req.user._id.toString();
    if (!isClient && !isProfessional) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { professional, service, serviceTitle, preferredDateTime, notes, offeredPrice } = req.body;
    const booking = await ServiceRequest.create({
      client: req.user._id,
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

const updateBookingStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const booking = await ServiceRequest.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isClient = booking.client.toString() === req.user._id.toString();
    const isProfessional = booking.professional.toString() === req.user._id.toString();

    if (!isClient && !isProfessional) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { status, cancelReason } = req.body;

    // Only professional can accept/reject/counter
    if (['accepted', 'rejected', 'countered'].includes(status) && !isProfessional) {
      return res.status(403).json({ message: 'Only the professional can perform this action' });
    }
    // Only client or professional can cancel
    if (status === 'cancelled' && !isClient && !isProfessional) {
      return res.status(403).json({ message: 'Not authorized to cancel' });
    }

    booking.status = status;
    if (cancelReason) booking.cancelReason = cancelReason;
    await booking.save();
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

const counterBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const booking = await ServiceRequest.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.professional.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the professional can counter-offer' });
    }

    const { price, proposedDateTime, notes } = req.body;
    booking.counterOffer = { price, proposedDateTime, notes };
    booking.status = 'countered';
    await booking.save();
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

module.exports = { getBookings, getBooking, createBooking, updateBookingStatus, counterBooking };
