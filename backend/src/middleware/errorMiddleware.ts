import { Request, Response, NextFunction } from 'express';
import { AppError } from '../services/authService.js';

/**
 * Centralized error handler middleware.
 */
export const errorMiddleware = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  // Log unexpected errors internally for debugging
  console.error('[Unhandled Server Error]', err);

  res.status(500).json({
    success: false,
    message: 'An internal server error occurred. Please try again later.',
  });
};
