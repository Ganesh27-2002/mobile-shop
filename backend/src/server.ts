import path from 'path';
import dotenv from 'dotenv';

// Load .env before any other module executes
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { authenticateDatabase, sequelize } from './config/database.js';
import { logger } from './utils/logger.js';
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

// HTTP Request Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl || req.url} ${res.statusCode} [${duration}ms]`, {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
    });
  });
  next();
});

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
  } catch (error) {
    logger.error('Health check failed: Unable to connect to database', {
      error: error instanceof Error ? error.message : String(error),
    });
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

// Process-level unhandled error loggers
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Promise Rejection detected', {
    reason: reason instanceof Error ? reason.stack || reason.message : String(reason),
  });
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception detected', {
    message: err.message,
    stack: err.stack,
  });
});

// Start Server & Authenticate Database
const startServer = async () => {
  isDatabaseConnected = await authenticateDatabase();

  const server = app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
    logger.info(
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

