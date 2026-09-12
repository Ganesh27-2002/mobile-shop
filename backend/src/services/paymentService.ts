import { AppError } from './authService.js';
import { PaymentStatus } from '../models/Payment.js';

export interface CardDetails {
  cardNumber: string;
  cardHolder: string;
  expiry: string; // 'MM/YY'
  cvv: string;
}

export interface PaymentProcessInput {
  paymentMethod: 'COD' | 'CARD';
  amount: number;
  cardDetails?: CardDetails;
}

export interface PaymentProcessResult {
  provider: 'RAZORPAY';
  providerOrderId: 'COD' | 'CARD';
  providerPaymentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
}

/**
 * Validates a credit/debit card number using the Luhn (mod 10) algorithm.
 */
export const validateLuhn = (cardNumber: string): boolean => {
  const sanitized = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
  if (!/^\d{13,19}$/.test(sanitized)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

/**
 * Validates card expiry in MM/YY format against current month/year.
 */
export const validateExpiry = (expiry: string): boolean => {
  const match = expiry.trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!match) return false;

  const month = parseInt(match[1], 10);
  const year2Digits = parseInt(match[2], 10);
  const fullYear = 2000 + year2Digits;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  if (fullYear < currentYear) {
    return false;
  }

  if (fullYear === currentYear && month < currentMonth) {
    return false;
  }

  return true;
};

/**
 * Validates CVV (3 or 4 digits).
 */
export const validateCvv = (cvv: string): boolean => {
  return /^\d{3,4}$/.test(cvv.trim());
};

/**
 * Validates card details. Throws AppError if validation fails.
 */
export const validateCardDetails = (details?: CardDetails): void => {
  if (!details) {
    throw new AppError('Card details are required for CARD payment method', 400);
  }

  if (!details.cardHolder || details.cardHolder.trim().length === 0) {
    throw new AppError('Cardholder name is required', 400);
  }

  const sanitizedCardNumber = details.cardNumber?.replace(/\s+/g, '').replace(/-/g, '') || '';
  if (!validateLuhn(sanitizedCardNumber)) {
    throw new AppError('Invalid card number. Please check the digits and try again.', 400);
  }

  if (!details.expiry || !validateExpiry(details.expiry)) {
    throw new AppError('Card expiry is invalid or expired. Use MM/YY format.', 400);
  }

  if (!details.cvv || !validateCvv(details.cvv)) {
    throw new AppError('Invalid CVV. CVV must be 3 or 4 digits.', 400);
  }
};

/**
 * Simulates payment processing for COD and Card.
 */
export const processDummyPayment = (input: PaymentProcessInput): PaymentProcessResult => {
  const { paymentMethod, amount, cardDetails } = input;

  if (paymentMethod === 'COD') {
    const transactionId = `COD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return {
      provider: 'RAZORPAY',
      providerOrderId: 'COD',
      providerPaymentId: transactionId,
      amount,
      currency: 'INR',
      status: 'PENDING',
    };
  }

  if (paymentMethod === 'CARD') {
    validateCardDetails(cardDetails);
    const transactionId = `DEMO-CARD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return {
      provider: 'RAZORPAY',
      providerOrderId: 'CARD',
      providerPaymentId: transactionId,
      amount,
      currency: 'INR',
      status: 'SUCCESS',
    };
  }

  throw new AppError(`Unsupported payment method: ${paymentMethod}`, 400);
};
