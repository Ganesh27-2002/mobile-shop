import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../types/auth.js';

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
    res.status(401).json({
      success: false,
      message: 'Authentication required. Missing or malformed Bearer token.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token || token.trim() === '') {
    res.status(401).json({
      success: false,
      message: 'Authentication token is empty.',
    });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err: unknown) {
    res.status(401).json({
      success: false,
      message: 'Invalid, expired, or malformed authentication token.',
    });
  }
};
