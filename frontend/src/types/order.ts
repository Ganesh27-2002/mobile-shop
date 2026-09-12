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
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  shippingAddress: OrderAddress | null;
  items: OrderItem[];
  payment: OrderPayment | null;
}
