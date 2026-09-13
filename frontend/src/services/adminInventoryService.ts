import { api } from './api.js';
import type { AdminInventoryItem, AdminPagination } from '../types/admin.js';

export interface AdminInventoryFilters {
  search?: string;
  status?: string;
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface AdminInventoryResponse {
  items: AdminInventoryItem[];
  pagination: AdminPagination;
}

export const getAdminInventory = async (
  filters: AdminInventoryFilters = {}
): Promise<AdminInventoryResponse> => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.category) params.append('category', filters.category);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const response = await api.get<{
    success: boolean;
    data: AdminInventoryItem[];
    pagination: AdminPagination;
  }>(`/admin/inventory?${params.toString()}`);

  return {
    items: response.data.data,
    pagination: response.data.pagination,
  };
};
