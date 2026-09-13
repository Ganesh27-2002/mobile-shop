import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware that restricts access to users with the 'ADMIN' role.
 * Must be preceded by authMiddleware.
 */
export const adminMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    logger.warn('Admin access rejected: No authenticated user present', {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip,
    });
    res.status(401).json({
      success: false,
      message: 'Authentication required before verifying admin privileges.',
    });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    logger.warn('Admin access forbidden: Insufficient privileges', {
      userId: req.user.userId,
      userRole: req.user.role,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip,
    });
    res.status(403).json({
      success: false,
      message: 'Forbidden: Admin privileges required to access this resource.',
    });
    return;
  }

  logger.debug('Admin privilege verified successfully', {
    userId: req.user.userId,
    url: req.originalUrl || req.url,
  });

  next();
};
