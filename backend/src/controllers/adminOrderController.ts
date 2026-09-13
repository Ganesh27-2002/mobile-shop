import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.js';
import * as adminOrderService from '../services/adminOrderService.js';

export const getOrders = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await adminOrderService.getAdminOrders(req.query);
    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await adminOrderService.getAdminOrderById(req.params.id as string);
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await adminOrderService.updateOrderStatus(req.params.id as string, req.body);
    res.status(200).json({
      success: true,
      message: `Order status updated to ${order.status}`,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};
