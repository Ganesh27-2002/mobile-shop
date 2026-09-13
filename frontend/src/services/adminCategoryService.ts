import { api } from './api.js';
import type { AdminCategory } from '../types/admin.js';

export const getAdminCategories = async (): Promise<AdminCategory[]> => {
  const response = await api.get<{ success: boolean; data: AdminCategory[] }>('/admin/categories');
  return response.data.data;
};

export const getAdminCategoryById = async (id: string): Promise<AdminCategory> => {
  const response = await api.get<{ success: boolean; data: AdminCategory }>(`/admin/categories/${id}`);
  return response.data.data;
};

export const createAdminCategory = async (data: {
  name: string;
  slug?: string;
  description?: string;
}): Promise<AdminCategory> => {
  const response = await api.post<{ success: boolean; message: string; data: AdminCategory }>(
    '/admin/categories',
    data
  );
  return response.data.data;
};

export const updateAdminCategory = async (
  id: string,
  data: { name?: string; slug?: string; description?: string }
): Promise<AdminCategory> => {
  const response = await api.put<{ success: boolean; message: string; data: AdminCategory }>(
    `/admin/categories/${id}`,
    data
  );
  return response.data.data;
};

export const deleteAdminCategory = async (id: string): Promise<void> => {
  await api.delete(`/admin/categories/${id}`);
};
