const { validationResult } = require('express-validator');
const Company = require('../models/Company');
const User = require('../models/User');

const getCompanies = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = { isActive: true };
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

const getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('professionals', 'name email avatar');
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json(company);
  } catch (err) {
    next(err);
  }
};

const createCompany = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const { name, description, email, phone, website, address, logo } = req.body;
    const company = await Company.create({
      name, description, email, phone, website, address, logo,
      owner: req.user._id,
    });
    await company.populate('owner', 'name email');
    res.status(201).json(company);
  } catch (err) {
    next(err);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    if (company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this company' });
    }
    const allowed = ['name', 'description', 'email', 'phone', 'website', 'address', 'logo'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) company[field] = req.body[field];
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

const addProfessional = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    if (company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { userId } = req.body;
    const professional = await User.findById(userId);
    if (!professional) return res.status(404).json({ message: 'User not found' });
    if (professional.role !== 'professional') {
      return res.status(400).json({ message: 'User is not a professional' });
    }
    if (company.professionals.map(p => p.toString()).includes(userId)) {
      return res.status(409).json({ message: 'Professional already in company' });
    }
    company.professionals.push(userId);
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

const removeProfessional = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    if (company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    company.professionals = company.professionals.filter(
      p => p.toString() !== req.params.profId
    );
    await company.save();
    res.json({ message: 'Professional removed from company' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCompanies, getCompany, createCompany, updateCompany, addProfessional, removeProfessional };
