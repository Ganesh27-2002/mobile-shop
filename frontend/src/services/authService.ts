import { api } from './api.js';
import type {
  SignupRequest,
  LoginRequest,
  User,
  AuthResponseData,
  ApiResponse,
} from '../types/auth.js';

export const authService = {
  async signup(data: SignupRequest): Promise<User> {
    const response = await api.post<ApiResponse<{ user: User }>>('/auth/signup', data);
    if (!response.data.data?.user) {
      throw new Error(response.data.message || 'Registration failed');
    }
    return response.data.data.user;
  },

  async login(credentials: LoginRequest): Promise<AuthResponseData> {
    const response = await api.post<ApiResponse<AuthResponseData>>('/auth/login', credentials);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Login failed');
    }
    return response.data.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    if (!response.data.data?.user) {
      throw new Error(response.data.message || 'Failed to fetch user profile');
    }
    return response.data.data.user;
  },
};
