import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.js';

export const testAdmin = (req: AuthenticatedRequest, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'Admin access granted',
    data: {
      user: req.user,
    },
  });
};
