import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Cart } from '../models/Cart.js';
import { generateToken } from '../utils/jwt.js';
import {
  SignupInput,
  LoginInput,
  UserResponseData,
  AuthResponseData,
} from '../types/auth.js';

export class AppError extends Error {
  public statusCode: number;
  public errors?: string[];

  constructor(message: string, statusCode: number, errors?: string[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Registers a new customer user and initializes their cart.
 */
export const signupUser = async (input: SignupInput): Promise<UserResponseData> => {
  const normalizedEmail = input.email.trim().toLowerCase();

  // Check for duplicate email
  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new AppError('Email is already registered. Please login instead.', 409);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(input.password, salt);

  // Create User
  const newUser = await User.create({
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    phone: input.phone?.trim() || null,
    role: 'CUSTOMER',
    isActive: true,
  });

  // Create empty shopping cart for the user
  await Cart.create({
    userId: newUser.id,
  });

  return {
    id: newUser.id,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    email: newUser.email,
    phone: newUser.phone,
    role: newUser.role,
    isActive: newUser.isActive,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt,
  };
};

/**
 * Validates credentials, checks active status, and returns JWT token with safe user information.
 */
export const loginUser = async (input: LoginInput): Promise<AuthResponseData> => {
  const normalizedEmail = input.email.trim().toLowerCase();

  // Query user with password included
  const user = await User.scope('withPassword').findOne({
    where: { email: normalizedEmail },
  });

  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(input.password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate JWT Token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
};

/**
 * Retrieves the current authenticated user's profile from database.
 */
export const getCurrentUser = async (userId: string): Promise<UserResponseData> => {
  const user = await User.findByPk(userId);

  if (!user || !user.isActive) {
    throw new AppError('User not found or account is deactivated', 401);
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
