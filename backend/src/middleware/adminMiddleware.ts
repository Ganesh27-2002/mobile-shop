import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.js';

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
    res.status(401).json({
      success: false,
      message: 'Authentication required before verifying admin privileges.',
    });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Forbidden: Admin privileges required to access this resource.',
    });
    return;
  }

  next();
};
