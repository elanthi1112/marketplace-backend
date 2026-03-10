const { validationResult } = require('express-validator');
const Service = require('../models/Service');

const getServices = async (req, res, next) => {
  try {
    const rawPage = Number(req.query.page);
    const rawLimit = Number(req.query.limit);
    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;
    const { category, search, professional } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (professional) filter.professional = professional;
    if (search) filter.$text = { $search: search };

    const skip = (page - 1) * limit;
    const [services, total] = await Promise.all([
      Service.find(filter)
        .populate('professional', 'name email avatar')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Service.countDocuments(filter),
    ]);
    res.json({ services, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

const getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate('professional', 'name email avatar');
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) {
    next(err);
  }
};

const createService = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { title, description, price, priceType, minimumCharge, travelFee, category, imageUrl } = req.body;
    const service = await Service.create({
      title, description, price, priceType, minimumCharge, travelFee, category, imageUrl,
      professional: req.user._id,
    });
    await service.populate('professional', 'name email avatar');
    res.status(201).json(service);
  } catch (err) {
    next(err);
  }
};

const updateService = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    if (service.professional.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this service' });
    }
    const allowed = ['title', 'description', 'price', 'priceType', 'minimumCharge', 'travelFee', 'category', 'imageUrl', 'isActive'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) service[field] = req.body[field];
    });
    await service.save();
    await service.populate('professional', 'name email avatar');
    res.json(service);
  } catch (err) {
    next(err);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    if (service.professional.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this service' });
    }
    await service.deleteOne();
    res.json({ message: 'Service deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getServices, getService, createService, updateService, deleteService };
