import path from 'path';
import dotenv from 'dotenv';

// Load .env before any other module executes
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { authenticateDatabase, sequelize } from './config/database.js';
// Import models to ensure associations are registered
import './models/index.js';

// Import Routes & Middlewares
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

let isDatabaseConnected = false;

// Middleware
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);

// Health Check Endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await sequelize.authenticate();
    dbStatus = 'connected';
    isDatabaseConnected = true;
  } catch {
    dbStatus = 'disconnected';
    isDatabaseConnected = false;
  }

  res.status(200).json({
    success: true,
    message: 'Mobile Shop API is running',
    database: dbStatus,
  });
});

// Centralized Error Handling Middleware
app.use(errorMiddleware);

// Start Server & Authenticate Database
const startServer = async () => {
  isDatabaseConnected = await authenticateDatabase();

  const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(
      `Database status: ${
        isDatabaseConnected
          ? 'Connected'
          : 'Disconnected (Check PostgreSQL configuration)'
      }`
    );
  });

  return server;
};

const serverPromise = startServer();

export { app, serverPromise };
