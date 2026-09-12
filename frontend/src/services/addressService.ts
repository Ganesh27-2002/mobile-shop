import { api, getApiErrorMessage } from './api.js';
import type { Address, AddressInput } from '../types/address.js';

export const addressService = {
  async getAddresses(): Promise<Address[]> {
    try {
      const response = await api.get('/addresses');
      return response.data.data.addresses;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  async createAddress(data: AddressInput): Promise<Address> {
    try {
      const response = await api.post('/addresses', data);
      return response.data.data.address;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  async updateAddress(id: string, data: Partial<AddressInput>): Promise<Address> {
    try {
      const response = await api.put(`/addresses/${id}`, data);
      return response.data.data.address;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  async deleteAddress(id: string): Promise<void> {
    try {
      await api.delete(`/addresses/${id}`);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },

  async setDefaultAddress(id: string): Promise<Address> {
    try {
      const response = await api.patch(`/addresses/${id}/default`);
      return response.data.data.address;
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  },
};
