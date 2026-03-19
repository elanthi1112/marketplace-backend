import { validationResult } from 'express-validator';
import User from '../models/User';
import { Request, Response, NextFunction } from 'express';

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({
      success: true,
      message: 'User profile fetched successfully',
      data: (req as any).user
    });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    const { name, email, phone, avatar } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate((req as any).user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({
      success: true,
      message: 'User profile updated successfully',
      data: user
    });
  } catch (err) {
    next(err);
  }
};

export const switchRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.body;
    if (!['user', 'professional'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Role must be user or professional'
      });
      return;
    }
    const user = await User.findByIdAndUpdate(
      (req as any).user._id,
      { role },
      { new: true, runValidators: true }
    );
    res.json({
      success: true,
      message: `Role switched to ${role}`,
      data: user
    });
  } catch (err) {
    next(err);
  }
};
