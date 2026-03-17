import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User';
import { Request, Response, NextFunction } from 'express';

const signToken = (id: string): string =>
  jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions);

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
      return;
    }
    const user = await User.create({ name, email, password, role });
    const token = signToken(user._id.toString());
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }
    const token = signToken(user._id.toString());
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user
    });
  } catch (err) {
    next(err);
  }
};
