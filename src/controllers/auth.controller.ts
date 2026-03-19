export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token required' });
      return;
    }
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string);
    } catch {
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
      return;
    }
    const token = signToken(decoded.id);
    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
};

import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User';
import { Request, Response, NextFunction } from 'express';
import { sendEmail } from '../utils/email';

const signToken = (id: string, expiresIn?: string): string =>
  jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions);

const signRefreshToken = (id: string): string =>
  jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '30d' } as jwt.SignOptions);

// In-memory store for demo; use Redis or DB in production
const verificationCodes = new Map<string, { code: string, expires: number }>();

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

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(email, { code, expires: Date.now() + 10 * 60 * 1000 });
    // Print code to terminal for testing
    console.log("===== TEST LOG =====");
    console.log(`[DEV] Verification code for ${email}: ${code}`);
    console.log("===== END =====");
    await sendEmail(email, 'Your Verification Code', `Your code is: ${code}`);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to email',
      email
    });
  } catch (err) {
    next(err);
  }
};

export const verifyCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code, name, password, role } = req.body;
    const entry = verificationCodes.get(email);
    if (!entry || entry.code !== code || entry.expires < Date.now()) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
      return;
    }
    verificationCodes.delete(email);
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
    const refreshToken = signRefreshToken(user._id.toString());
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      refreshToken,
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
    const refreshToken = signRefreshToken(user._id.toString());
    res.json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user
    });
  } catch (err) {
    next(err);
  }
};
