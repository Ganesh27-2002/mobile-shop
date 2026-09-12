import type { Address } from './address.js';
import type { Cart } from './cart.js';

export interface PricingSummary {
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  isFreeShipping: boolean;
}

export interface CheckoutSummary {
  cart: Cart;
  pricing: PricingSummary;
  addresses: Address[];
  defaultAddress: Address | null;
  canCheckout: boolean;
  stockIssues?: string[];
}

export interface CardDetails {
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
}

export interface OrderPlacementInput {
  addressId: string;
  paymentMethod: 'COD' | 'CARD';
  cardDetails?: CardDetails;
}
