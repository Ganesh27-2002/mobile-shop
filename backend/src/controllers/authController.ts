import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.js';
import * as authService from '../services/authService.js';

export const signup = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await authService.signupUser(req.body);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authData = await authService.loginUser(req.body);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: authData,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User context missing',
      });
      return;
    }

    const user = await authService.getCurrentUser(req.user.userId);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
