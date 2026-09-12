import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.js';
import * as orderService from '../services/orderService.js';
import { AppError } from '../services/authService.js';

export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new AppError('Authentication required.', 401);
    }

    const order = await orderService.createOrder(req.user.userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new AppError('Authentication required.', 401);
    }

    const orders = await orderService.getOrders(req.user.userId);

    res.status(200).json({
      success: true,
      data: {
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new AppError('Authentication required.', 401);
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const order = await orderService.getOrderById(req.user.userId, id);

    res.status(200).json({
      success: true,
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};
