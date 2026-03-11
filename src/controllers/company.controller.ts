import { validationResult } from 'express-validator';
import Company from '../models/Company';
import User from '../models/User';
import { Request, Response, NextFunction } from 'express';

export const getCompanies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search } = req.query;
    const filter: any = { isActive: true };
    if (search) filter.$text = { $search: search };
    const companies = await Company.find(filter)
      .populate('owner', 'name email')
      .populate('professionals', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json(companies);
  } catch (err) {
    next(err);
  }
};

export const getCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('professionals', 'name email avatar');
    if (!company) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }
    res.json(company);
  } catch (err) {
    next(err);
  }
};

export const createCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      return;
    }
    const { name, description, email, phone, website, address, logo } = req.body;
    const company = await Company.create({
      name, description, email, phone, website, address, logo,
      owner: (req as any).user._id,
    });
    await company.populate('owner', 'name email');
    res.status(201).json(company);
  } catch (err) {
    next(err);
  }
};

export const updateCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      return;
    }
    const company = await Company.findById(req.params.id);
    if (!company) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }
    if ((company as any).owner.toString() !== (req as any).user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to update this company' });
      return;
    }
    const allowed = ['name', 'description', 'email', 'phone', 'website', 'address', 'logo'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) (company as any)[field] = req.body[field];
    });
    await company.save();
    await company.populate([
      { path: 'owner', select: 'name email' },
      { path: 'professionals', select: 'name email avatar' },
    ]);
    res.json(company);
  } catch (err) {
    next(err);
  }
};

export const addProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }
    if ((company as any).owner.toString() !== (req as any).user._id.toString()) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }
    const { userId } = req.body;
    const professional = await User.findById(userId);
    if (!professional) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    if ((professional as any).role !== 'professional') {
      res.status(400).json({ message: 'User is not a professional' });
      return;
    }
    if ((company as any).professionals.map((p: any) => p.toString()).includes(userId)) {
      res.status(409).json({ message: 'Professional already in company' });
      return;
    }
    (company as any).professionals.push(userId);
    await company.save();
    await company.populate([
      { path: 'owner', select: 'name email' },
      { path: 'professionals', select: 'name email avatar' },
    ]);
    res.json(company);
  } catch (err) {
    next(err);
  }
};

export const removeProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }
    if ((company as any).owner.toString() !== (req as any).user._id.toString()) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }
    (company as any).professionals = (company as any).professionals.filter(
      (p: any) => p.toString() !== req.params.profId
    );
    await company.save();
    res.json({ message: 'Professional removed from company' });
  } catch (err) {
    next(err);
  }
};
