import dotenv from 'dotenv';
import app from './app';
import connectDB from './config/db';

dotenv.config();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

const start = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start().catch((err: Error) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
