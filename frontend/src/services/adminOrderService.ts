import { api } from './api.js';
import type { AdminOrder, AdminPagination } from '../types/admin.js';

export interface AdminOrderFilters {
  search?: string;
  status?: string;
  paymentStatus?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface AdminOrdersResponse {
  orders: AdminOrder[];
  pagination: AdminPagination;
}

export const getAdminOrders = async (filters: AdminOrderFilters = {}): Promise<AdminOrdersResponse> => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const response = await api.get<{
    success: boolean;
    data: AdminOrder[];
    pagination: AdminPagination;
  }>(`/admin/orders?${params.toString()}`);

  return {
    orders: response.data.data,
    pagination: response.data.pagination,
  };
};

export const getAdminOrderById = async (id: string): Promise<AdminOrder> => {
  const response = await api.get<{ success: boolean; data: AdminOrder }>(`/admin/orders/${id}`);
  return response.data.data;
};

export const updateAdminOrderStatus = async (
  id: string,
  status: string,
  cancellationReason?: string
): Promise<AdminOrder> => {
  const response = await api.patch<{ success: boolean; message: string; data: AdminOrder }>(
    `/admin/orders/${id}/status`,
    { status, cancellationReason }
  );
  return response.data.data;
};
