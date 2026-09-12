import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { JwtPayload } from '../types/auth.js';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const getJwtSecret = (): Secret => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
    }
    return 'default-development-jwt-secret-key-3.0';
  }
  return secret;
};

const getJwtExpiresIn = (): string | number => {
  return process.env.JWT_EXPIRES_IN || '1d';
};

/**
 * Generates a signed JWT token containing userId, email, and role.
 */
export const generateToken = (payload: JwtPayload): string => {
  const secret = getJwtSecret();
  const expiresIn = getJwtExpiresIn();

  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn'],
  };

  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    },
    secret,
    options
  );
};

/**
 * Verifies a JWT token and returns the decoded JwtPayload.
 * Throws an error if invalid or expired.
 */
export const verifyToken = (token: string): JwtPayload => {
  const secret = getJwtSecret();
  const decoded = jwt.verify(token, secret);
  return decoded as JwtPayload;
};
