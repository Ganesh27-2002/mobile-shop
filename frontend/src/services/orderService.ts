import { api, getApiErrorMessage } from './api.js';
import type { Order, OrderTrackingData } from '../types/order.js';
import type { OrderPlacementInput } from '../types/checkout.js';

export const orderService = {
  async createOrder(input: OrderPlacementInput): Promise<Order> {
    try {
      const response = await api.post('/orders', input);
      return response.data.data.order;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  async getOrders(): Promise<Order[]> {
    try {
      const response = await api.get('/orders');
      return response.data.data.orders;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  async getOrderById(id: string): Promise<Order> {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data.data.order;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  async trackOrder(id: string): Promise<OrderTrackingData> {
    try {
      const response = await api.get(`/orders/${id}/tracking`);
      return response.data.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  async cancelOrder(id: string, reason?: string): Promise<Order> {
    try {
      const response = await api.post(`/orders/${id}/cancel`, { reason });
      return response.data.data.order;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },
};
