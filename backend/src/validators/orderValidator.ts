import { z } from 'zod';

export const cardDetailsSchema = z.object({
  cardNumber: z
    .string()
    .min(13, 'Card number must be at least 13 digits')
    .max(19, 'Card number must not exceed 19 digits'),
  cardHolder: z
    .string()
    .min(2, 'Cardholder name must be at least 2 characters')
    .max(100, 'Cardholder name must not exceed 100 characters'),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry must be in MM/YY format'),
  cvv: z
    .string()
    .regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
});

export const createOrderSchema = z
  .object({
    addressId: z
      .string()
      .uuid('Invalid address ID format'),
    paymentMethod: z.enum(['COD', 'CARD']),
    cardDetails: cardDetailsSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.paymentMethod === 'CARD' && !data.cardDetails) {
        return false;
      }
      return true;
    },
    {
      message: 'Card details are required when payment method is CARD',
      path: ['cardDetails'],
    }
  );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
