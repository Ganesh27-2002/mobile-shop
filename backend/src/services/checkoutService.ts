import { getCart, FormattedCart } from './cartService.js';
import { getAddresses } from './addressService.js';
import { calculatePricing, PricingSummary } from '../utils/pricing.js';
import { Address, Product } from '../models/index.js';

export interface CheckoutSummaryResponse {
  cart: FormattedCart;
  pricing: PricingSummary;
  addresses: Address[];
  defaultAddress: Address | null;
  canCheckout: boolean;
  stockIssues?: string[];
}

export const getCheckoutSummary = async (userId: string): Promise<CheckoutSummaryResponse> => {
  const cart = await getCart(userId);
  const addresses = await getAddresses(userId);
  const defaultAddress = addresses.find((addr) => addr.isDefault) || (addresses.length > 0 ? addresses[0] : null);
  const pricing = calculatePricing(cart.subtotal);

  const stockIssues: string[] = [];
  let isStockValid = true;

  if (cart.items.length === 0) {
    isStockValid = false;
  } else {
    for (const item of cart.items) {
      const product = await Product.findByPk(item.product.id);
      if (!product || !product.isActive) {
        stockIssues.push(`Product "${item.product.name}" is no longer available.`);
        isStockValid = false;
      } else if (product.stock < item.quantity) {
        stockIssues.push(`Requested quantity for "${item.product.name}" (${item.quantity}) exceeds available stock (${product.stock}).`);
        isStockValid = false;
      }
    }
  }

  return {
    cart,
    pricing,
    addresses,
    defaultAddress,
    canCheckout: isStockValid && addresses.length > 0,
    stockIssues: stockIssues.length > 0 ? stockIssues : undefined,
  };
};
