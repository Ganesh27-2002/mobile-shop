import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.js';
import * as cartService from '../services/cartService.js';
import { AppError } from '../services/authService.js';

/**
 * GET /api/cart
 */
export const getCart = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new AppError('Authentication required.', 401);
    }

    const cart = await cartService.getCart(req.user.userId);

    res.status(200).json({
      success: true,
      data: {
        cart,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/cart
 */
export const addToCart = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new AppError('Authentication required.', 401);
    }

    const { productId, quantity } = req.body;

    const cart = await cartService.addToCart(req.user.userId, productId, quantity);

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        cart,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/cart/items/:id
 */
export const updateCartItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new AppError('Authentication required.', 401);
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { quantity } = req.body;

    const cart = await cartService.updateCartItem(req.user.userId, id, quantity);

    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: {
        cart,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/cart/items/:id
 */
export const removeCartItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new AppError('Authentication required.', 401);
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const cart = await cartService.removeCartItem(req.user.userId, id);

    res.status(200).json({
      success: true,
      message: 'Cart item removed successfully',
      data: {
        cart,
      },
    });
  } catch (error) {
    next(error);
  }
};
