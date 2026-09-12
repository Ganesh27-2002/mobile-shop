import { Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/categoryService.js';

/**
 * GET /api/categories
 */
export const getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await categoryService.getCategories();

    res.status(200).json({
      success: true,
      data: {
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
};
