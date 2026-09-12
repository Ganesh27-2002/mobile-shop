import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters long'),
  phone: z
    .string()
    .trim()
    .refine(
      (val) => /^(\+91[\-\s]?)?[6789]\d{9}$|^[0-9]{10}$/.test(val.replace(/\s+/g, '')),
      'Please enter a valid 10-digit mobile number'
    ),
  addressLine1: z
    .string()
    .trim()
    .min(3, 'Address Line 1 must be at least 3 characters long'),
  addressLine2: z
    .string()
    .trim()
    .optional()
    .nullable(),
  city: z
    .string()
    .trim()
    .min(2, 'City is required'),
  state: z
    .string()
    .trim()
    .min(2, 'State is required'),
  postalCode: z
    .string()
    .trim()
    .refine(
      (val) => /^[1-9][0-9]{5}$/.test(val),
      'Postal code must be a valid 6-digit Indian PIN code'
    ),
  country: z
    .string()
    .trim()
    .default('India'),
  isDefault: z
    .boolean()
    .optional()
    .default(false),
});

export const updateAddressSchema = addressSchema.partial();
