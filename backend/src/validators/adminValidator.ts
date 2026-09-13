import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  brand: z.string().trim().min(1, 'Brand is required'),
  model: z.string().trim().min(1, 'Model is required'),
  description: z.string().optional().default(''),
  price: z.coerce.number().positive('Price must be greater than 0'),
  originalPrice: z.coerce.number().positive('Original price must be greater than 0').optional(),
  discountPercentage: z.coerce.number().min(0).max(100).optional().default(0),
  stock: z.coerce.number().int('Stock must be an integer').min(0, 'Stock cannot be negative'),
  image: z.string().min(1, 'Image path is required'),
  categoryId: z.string().uuid('Invalid category ID'),
  isActive: z.boolean().optional().default(true),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  brand: z.string().trim().min(1, 'Brand is required').optional(),
  model: z.string().trim().min(1, 'Model is required').optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be greater than 0').optional(),
  originalPrice: z.coerce.number().positive('Original price must be greater than 0').optional(),
  discountPercentage: z.coerce.number().min(0).max(100).optional(),
  stock: z.coerce.number().int('Stock must be an integer').min(0, 'Stock cannot be negative').optional(),
  image: z.string().min(1, 'Image path is required').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  isActive: z.boolean().optional(),
});

export const updateStockSchema = z.object({
  stock: z.coerce.number().int('Stock must be an integer').min(0, 'Stock cannot be negative'),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  slug: z.string().trim().optional(),
  description: z.string().optional().default(''),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  slug: z.string().trim().optional(),
  description: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PLACED', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  cancellationReason: z.string().max(500).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
