import { api } from './api.js';
import type { DashboardStats } from '../types/admin.js';

export const getAdminDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<{ success: boolean; data: DashboardStats }>('/admin/dashboard');
  return response.data.data;
};
