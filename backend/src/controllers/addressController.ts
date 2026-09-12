import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.js';
import * as addressService from '../services/addressService.js';
import { AppError } from '../services/authService.js';

export const getAddresses = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new AppError('Authentication required.', 401);
    }

    const addresses = await addressService.getAddresses(req.user.userId);

    res.status(200).json({
      success: true,
      data: {
        addresses,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createAddress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new AppError('Authentication required.', 401);
    }

    const address = await addressService.createAddress(req.user.userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: {
        address,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new AppError('Authentication required.', 401);
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const address = await addressService.updateAddress(req.user.userId, id, req.body);

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: {
        address,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new AppError('Authentication required.', 401);
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await addressService.deleteAddress(req.user.userId, id);

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const setDefaultAddress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new AppError('Authentication required.', 401);
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const address = await addressService.setDefaultAddress(req.user.userId, id);

    res.status(200).json({
      success: true,
      message: 'Default address updated successfully',
      data: {
        address,
      },
    });
  } catch (error) {
    next(error);
  }
};
