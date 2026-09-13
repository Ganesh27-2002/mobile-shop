import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware that validates the JWT Bearer token in the Authorization header.
 * Attaches the decoded payload to req.user.
 */
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Authentication rejected: Missing or malformed Bearer token', {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip,
    });
    res.status(401).json({
      success: false,
      message: 'Authentication required. Missing or malformed Bearer token.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token || token.trim() === '') {
    logger.warn('Authentication rejected: Token string is empty', {
      method: req.method,
      url: req.originalUrl || req.url,
    });
    res.status(401).json({
      success: false,
      message: 'Authentication token is empty.',
    });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    logger.debug('Authentication verified successfully', {
      userId: decoded.userId,
      role: decoded.role,
      url: req.originalUrl || req.url,
    });
    next();
  } catch (err: unknown) {
    logger.warn('Authentication rejected: Invalid or expired token', {
      method: req.method,
      url: req.originalUrl || req.url,
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(401).json({
      success: false,
      message: 'Invalid, expired, or malformed authentication token.',
    });
  }
};
