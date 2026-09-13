export interface DashboardStats {
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  customers: {
    total: number;
  };
  revenue: {
    total: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customer: {
      id: string;
      name: string;
      email: string;
    };
    date: string;
    amount: number;
    paymentMethod?: string;
    paymentStatus?: string;
    orderStatus: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    brand: string;
    model: string;
    category: string;
    currentStock: number;
    threshold: number;
    status: 'LOW STOCK' | 'OUT OF STOCK';
  }>;
  topProducts: Array<{
    id: string | null;
    name: string;
    brand: string;
    unitsSold: number;
    revenue: number;
  }>;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  model: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  stock: number;
  image: string;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInventoryItem {
  id: string;
  name: string;
  brand: string;
  model: string;
  image: string;
  category: {
    id: string;
    name: string;
  } | null;
  currentStock: number;
  lowStockThreshold: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT OF STOCK';
  lastUpdated: string;
}

export interface AdminOrderItem {
  id: string;
  productId: string | null;
  productName: string;
  productBrand: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  userId: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  status: string;
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
  tracking?: {
    orderId: string;
    orderNumber: string;
    status: string;
    cancellationReason?: string | null;
    cancelledAt?: string | null;
    timeline: Array<{
      status: string;
      title: string;
      completed: boolean;
      timestamp: string | null;
    }>;
  };
  shippingAddress: {
    id: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  items: AdminOrderItem[];
  payment: {
    id: string;
    provider: string;
    providerOrderId: string | null;
    providerPaymentId: string | null;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  } | null;
}

export interface AdminCustomer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

export interface AdminCustomerDetail extends AdminCustomer {
  addresses: Array<{
    id: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    itemCount: number;
    paymentStatus: string;
    createdAt: string;
  }>;
}

export interface AdminPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
