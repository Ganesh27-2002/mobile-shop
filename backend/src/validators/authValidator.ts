import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// Signup validation schema
export const signupSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required'),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .refine(
      (val) => /[a-zA-Z]/.test(val) && /[0-9]/.test(val),
      'Password must contain at least one letter and one number'
    ),
  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (val) => !val || /^[+]?[0-9\s-]{7,15}$/.test(val),
      'Invalid phone number format'
    ),
});

// Login validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Password is required'),
});

/**
 * Higher-order middleware function to validate request body against a Zod schema.
 */
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const issues = (error as ZodError).issues || [];
        const errorMessages = issues.map((issue) => issue.message);
        res.status(400).json({
          success: false,
          message: errorMessages[0] || 'Validation failed',
          errors: errorMessages,
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: 'Invalid request body',
      });
    }
  };
};
