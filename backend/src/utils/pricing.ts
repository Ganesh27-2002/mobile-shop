export interface PricingSummary {
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  isFreeShipping: boolean;
}

export const roundPrice = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const calculatePricing = (subtotal: number): PricingSummary => {
  const roundedSubtotal = roundPrice(subtotal);
  const isFreeShipping = roundedSubtotal >= 500;
  const shippingAmount = isFreeShipping ? 0 : 50;
  const taxAmount = roundPrice(roundedSubtotal * 0.18);
  const totalAmount = roundPrice(roundedSubtotal + shippingAmount + taxAmount);

  return {
    subtotal: roundedSubtotal,
    shippingAmount,
    taxAmount,
    totalAmount,
    isFreeShipping,
  };
};
