import { validationResult } from 'express-validator';
import Service from '../models/Service';
import { Request, Response, NextFunction } from 'express';

export const getServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawPage = Number(req.query.page);
    const rawLimit = Number(req.query.limit);
    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;
    const { category, search, professional } = req.query as any;
    const filter: any = { isActive: true };
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
    res.json({
      success: true,
      message: 'Services fetched successfully',
      data: { services, total, page, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
};

export const getService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const service = await Service.findById(req.params.id).populate('professional', 'name email avatar');
    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Service not found'
      });
      return;
    }
    res.json({
      success: true,
      message: 'Service fetched successfully',
      data: service
    });
  } catch (err) {
    next(err);
  }
};

export const createService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }
    const { title, description, price, priceType, minimumCharge, travelFee, category, imageUrl } = req.body;
    const service = await Service.create({
      title, description, price, priceType, minimumCharge, travelFee, category, imageUrl,
      professional: (req as any).user._id,
    });
    await service.populate('professional', 'name email avatar');
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (err) {
    next(err);
  }
};

export const updateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }
    const service = await Service.findById(req.params.id);
    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Service not found'
      });
      return;
    }
    if (service.professional.toString() !== (req as any).user._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to update this service'
      });
      return;
    }
    const allowed = ['title', 'description', 'price', 'priceType', 'minimumCharge', 'travelFee', 'category', 'imageUrl', 'isActive'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) (service as any)[field] = req.body[field];
    });
    await service.save();
    await service.populate('professional', 'name email avatar');
    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (err) {
    next(err);
  }
};

export const deleteService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Service not found'
      });
      return;
    }
    if (service.professional.toString() !== (req as any).user._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to delete this service'
      });
      return;
    }
    await service.deleteOne();
    res.json({
      success: true,
      message: 'Service deleted'
    });
  } catch (err) {
    next(err);
  }
};
