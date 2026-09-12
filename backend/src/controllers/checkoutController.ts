import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.js';
import * as checkoutService from '../services/checkoutService.js';
import { AppError } from '../services/authService.js';

export const getCheckoutSummary = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new AppError('Authentication required.', 401);
    }

    const summary = await checkoutService.getCheckoutSummary(req.user.userId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
