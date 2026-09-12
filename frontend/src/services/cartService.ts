import { api } from './api.js';
import type { Cart, CartResponse } from '../types/cart.js';

export const cartService = {
  async getCart(): Promise<Cart> {
    const response = await api.get<CartResponse>('/cart');
    if (!response.data.data?.cart) {
      throw new Error(response.data.message || 'Failed to fetch cart');
    }
    return response.data.data.cart;
  },

  async addToCart(productId: string, quantity: number = 1): Promise<Cart> {
    const response = await api.post<CartResponse>('/cart', { productId, quantity });
    if (!response.data.data?.cart) {
      throw new Error(response.data.message || 'Failed to add item to cart');
    }
    return response.data.data.cart;
  },

  async updateCartItem(cartItemId: string, quantity: number): Promise<Cart> {
    const response = await api.put<CartResponse>(`/cart/items/${cartItemId}`, { quantity });
    if (!response.data.data?.cart) {
      throw new Error(response.data.message || 'Failed to update cart item');
    }
    return response.data.data.cart;
  },

  async removeCartItem(cartItemId: string): Promise<Cart> {
    const response = await api.delete<CartResponse>(`/cart/items/${cartItemId}`);
    if (!response.data.data?.cart) {
      throw new Error(response.data.message || 'Failed to remove item from cart');
    }
    return response.data.data.cart;
  },
};
