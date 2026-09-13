import { api } from './api.js';
import type { AdminCustomer, AdminCustomerDetail, AdminPagination } from '../types/admin.js';

export interface AdminCustomerFilters {
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface AdminCustomersResponse {
  customers: AdminCustomer[];
  pagination: AdminPagination;
}

export const getAdminCustomers = async (
  filters: AdminCustomerFilters = {}
): Promise<AdminCustomersResponse> => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const response = await api.get<{
    success: boolean;
    data: AdminCustomer[];
    pagination: AdminPagination;
  }>(`/admin/customers?${params.toString()}`);

  return {
    customers: response.data.data,
    pagination: response.data.pagination,
  };
};

export const getAdminCustomerById = async (id: string): Promise<AdminCustomerDetail> => {
  const response = await api.get<{ success: boolean; data: AdminCustomerDetail }>(`/admin/customers/${id}`);
  return response.data.data;
};
