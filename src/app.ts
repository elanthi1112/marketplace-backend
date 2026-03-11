import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import professionalRoutes from './routes/professional.routes';
import serviceRoutes from './routes/service.routes';
import bookingRoutes from './routes/booking.routes';
import companyRoutes from './routes/company.routes';
import messageRoutes from './routes/message.routes';
import errorHandler from './middleware/error.middleware';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});

app.get('/health', (req: Request, res: Response) => res.json({ status: 'ok' }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/professionals', apiLimiter, professionalRoutes);
app.use('/api/services', apiLimiter, serviceRoutes);
app.use('/api/bookings', apiLimiter, bookingRoutes);
app.use('/api/companies', apiLimiter, companyRoutes);
app.use('/api/messages', apiLimiter, messageRoutes);

app.use((req: Request, res: Response) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

export default app;
