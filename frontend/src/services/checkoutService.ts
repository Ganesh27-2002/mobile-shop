import { api, getApiErrorMessage } from './api.js';
import type { CheckoutSummary } from '../types/checkout.js';

export const checkoutService = {
  async getCheckoutSummary(): Promise<CheckoutSummary> {
    try {
      const response = await api.get('/checkout/summary');
      return response.data.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },
};
