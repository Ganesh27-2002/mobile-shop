import { api } from './api.js';
import type { AdminProduct, AdminPagination } from '../types/admin.js';

export interface AdminProductFilters {
  search?: string;
  category?: string;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface AdminProductsResponse {
  products: AdminProduct[];
  pagination: AdminPagination;
}

export const getAdminProducts = async (filters: AdminProductFilters = {}): Promise<AdminProductsResponse> => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.category) params.append('category', filters.category);
  if (filters.status) params.append('status', filters.status);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const response = await api.get<{
    success: boolean;
    data: AdminProduct[];
    pagination: AdminPagination;
  }>(`/admin/products?${params.toString()}`);

  return {
    products: response.data.data,
    pagination: response.data.pagination,
  };
};

export const getAdminProductById = async (id: string): Promise<AdminProduct> => {
  const response = await api.get<{ success: boolean; data: AdminProduct }>(`/admin/products/${id}`);
  return response.data.data;
};

export const createAdminProduct = async (data: Partial<AdminProduct>): Promise<AdminProduct> => {
  const response = await api.post<{ success: boolean; message: string; data: AdminProduct }>(
    '/admin/products',
    data
  );
  return response.data.data;
};

export const updateAdminProduct = async (id: string, data: Partial<AdminProduct>): Promise<AdminProduct> => {
  const response = await api.put<{ success: boolean; message: string; data: AdminProduct }>(
    `/admin/products/${id}`,
    data
  );
  return response.data.data;
};

export const updateAdminProductStatus = async (id: string, isActive: boolean): Promise<AdminProduct> => {
  const response = await api.patch<{ success: boolean; message: string; data: AdminProduct }>(
    `/admin/products/${id}/status`,
    { isActive }
  );
  return response.data.data;
};

export const updateAdminProductStock = async (
  id: string,
  stock: number
): Promise<{ previousStock: number; newStock: number; stockDifference: number; product: AdminProduct }> => {
  const response = await api.patch<{
    success: boolean;
    message: string;
    data: { previousStock: number; newStock: number; stockDifference: number; product: AdminProduct };
  }>(`/admin/products/${id}/stock`, { stock });
  return response.data.data;
};

export const deleteAdminProduct = async (id: string): Promise<void> => {
  await api.delete(`/admin/products/${id}`);
};

export const getAdminAllowedImages = async (): Promise<string[]> => {
  const response = await api.get<{ success: boolean; data: string[] }>('/admin/products/images');
  return response.data.data;
};
