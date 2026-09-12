import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/productService.js';

/**
 * GET /api/products
 * Query Parameters: search, category, sort, page, limit
 */
export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, category, sort, page, limit } = req.query;

    const result = await productService.getProducts({
      search: typeof search === 'string' ? search : undefined,
      category: typeof category === 'string' ? category : undefined,
      sort: typeof sort === 'string' ? sort : undefined,
      page: typeof page === 'string' ? page : undefined,
      limit: typeof limit === 'string' ? limit : undefined,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:id
 */
export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const product = await productService.getProductById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
};
