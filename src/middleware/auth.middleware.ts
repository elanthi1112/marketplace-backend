import jwt from 'jsonwebtoken';
import User from '../models/User';
import { Request, Response, NextFunction } from 'express';

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }
  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET as string);
  } catch {
    res.status(401).json({ message: 'Not authorized, invalid token' });
    return;
  }
  const user = await User.findById((decoded as any).id);
  if (!user) {
    res.status(401).json({ message: 'User not found' });
    return;
  }
  (req as any).user = user;
  next();
};

export const requireRole = (...roles: string[]) => (req: Request, res: Response, next: NextFunction): void => {
  if (!roles.includes((req as any).user.role)) {
    res.status(403).json({ message: 'Forbidden: insufficient role' });
    return;
  }
  next();
};
