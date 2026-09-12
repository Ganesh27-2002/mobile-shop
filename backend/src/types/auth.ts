import { Request } from 'express';
import { UserRole } from '../models/User.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface SignupInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UserResponseData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponseData {
  token: string;
  user: UserResponseData;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}
