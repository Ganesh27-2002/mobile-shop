import axios, { AxiosError } from 'axios';
import { getToken } from '../utils/token.js';
import type { ApiResponse } from '../types/auth.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token if present
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Extracts a safe user-facing error message from Axios API errors.
 */
export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse>;
    if (axiosError.response?.data) {
      const data = axiosError.response.data;
      if (data.message) {
        return data.message;
      }
      if (data.errors && data.errors.length > 0) {
        return data.errors[0];
      }
    }
    if (axiosError.response?.status === 400) {
      return 'Please check the information you entered.';
    }
    if (axiosError.response?.status === 401) {
      return 'Invalid email or password.';
    }
    if (axiosError.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (axiosError.response?.status === 409) {
      return 'An account with this email already exists.';
    }
    if (axiosError.response?.status === 500) {
      return 'Server error. Please try again later.';
    }
    if (axiosError.code === 'ERR_NETWORK') {
      return 'Unable to connect to the server. Please check your connection.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};
