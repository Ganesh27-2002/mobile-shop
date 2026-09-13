export type OrderStatus =
  | 'PLACED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string | null;
  productName: string;
  productBrand: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderPayment {
  id: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  confirmedAt?: string | null;
  processingAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  shippingAddress: OrderAddress | null;
  items: OrderItem[];
  payment: OrderPayment | null;
}

export interface TimelineStep {
  status: string;
  title: string;
  completed: boolean;
  timestamp: string | null;
}

export interface OrderTrackingData {
  orderId: string;
  orderNumber: string;
  status: string;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  timeline: TimelineStep[];
}
