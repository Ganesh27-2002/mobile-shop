import { Request, Response, NextFunction } from 'express';
import { AppError } from '../services/authService.js';
import { logger } from '../utils/logger.js';

/**
 * Centralized error handler middleware.
 */
export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn('Operational Application Error', {
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
      method: req.method,
      url: req.originalUrl || req.url,
    });

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  // Log unexpected errors with full stack trace via Winston
  logger.error('Unhandled Internal Server Error', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl || req.url,
  });

  res.status(500).json({
    success: false,
    message: 'An internal server error occurred. Please try again later.',
  });
};
