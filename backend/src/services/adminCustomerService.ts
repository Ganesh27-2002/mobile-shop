import { Op, Order as SeqOrder } from 'sequelize';
import { User, Order, Address, Payment, OrderItem } from '../models/index.js';
import { AppError } from './authService.js';
import { DEFAULT_PAGE_LIMIT } from '../config/constants.js';
import { roundPrice } from '../utils/pricing.js';

export interface AdminCustomerSummary {
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

export interface AdminCustomerDetail extends AdminCustomerSummary {
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

export interface PaginatedAdminCustomers {
  customers: AdminCustomerSummary[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface AdminCustomerQuery {
  search?: string;
  sort?: string;
  page?: string | number;
  limit?: string | number;
}

export const getAdminCustomers = async (query: AdminCustomerQuery): Promise<PaginatedAdminCustomers> => {
  const { search, sort, page, limit } = query;

  const rawPage = parseInt(String(page || '1'), 10);
  const rawLimit = parseInt(String(limit || DEFAULT_PAGE_LIMIT), 10);

  const currentPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const currentLimit = isNaN(rawLimit) || rawLimit <= 0 ? DEFAULT_PAGE_LIMIT : Math.min(100, rawLimit);
  const offset = (currentPage - 1) * currentLimit;

  // Search filter
  const searchFilter = search && search.trim().length > 0
    ? {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${search.trim()}%` } },
          { lastName: { [Op.iLike]: `%${search.trim()}%` } },
          { email: { [Op.iLike]: `%${search.trim()}%` } },
        ],
      }
    : {};

  let selectedSort: SeqOrder = [['createdAt', 'DESC']];
  if (sort === 'oldest') {
    selectedSort = [['createdAt', 'ASC']];
  } else if (sort === 'name_asc') {
    selectedSort = [['firstName', 'ASC']];
  }

  const { count, rows } = await User.findAndCountAll({
    where: {
      role: 'CUSTOMER',
      ...searchFilter,
    },
    attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'isActive', 'createdAt'],
    order: selectedSort,
    limit: currentLimit,
    offset,
  });

  const totalPages = Math.ceil(count / currentLimit) || 1;

  const customers: AdminCustomerSummary[] = await Promise.all(
    rows.map(async (user) => {
      const orderCount = await Order.count({
        where: { userId: user.id },
      });

      const totalSpentRaw = await Order.sum('totalAmount', {
        where: {
          userId: user.id,
          status: {
            [Op.ne]: 'CANCELLED',
          },
        },
      });
      const totalSpent = totalSpentRaw ? roundPrice(Number(totalSpentRaw)) : 0;

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        orderCount,
        totalSpent,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      };
    })
  );

  return {
    customers,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      totalItems: count,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
  };
};

export const getAdminCustomerById = async (customerId: string): Promise<AdminCustomerDetail> => {
  const user = await User.findOne({
    where: { id: customerId, role: 'CUSTOMER' },
    attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'isActive', 'createdAt'],
    include: [
      {
        model: Address,
        as: 'addresses',
      },
    ],
  });

  if (!user) {
    throw new AppError('Customer not found', 404);
  }

  const orders = await Order.findAll({
    where: { userId: customerId },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: OrderItem,
        as: 'items',
      },
      {
        model: Payment,
        as: 'payment',
      },
    ],
  });

  const orderCount = orders.length;
  const totalSpent = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (typeof o.totalAmount === 'number' ? o.totalAmount : parseFloat(String(o.totalAmount || 0))), 0);

  const formattedOrders = orders.map((o) => {
    const itemCount = (o.items || []).reduce((sum, item) => sum + item.quantity, 0);
    const amountVal = typeof o.totalAmount === 'number' ? o.totalAmount : parseFloat(String(o.totalAmount || 0));

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      totalAmount: roundPrice(amountVal),
      itemCount,
      paymentStatus: o.payment?.status || 'PENDING',
      createdAt: o.createdAt?.toISOString() || new Date().toISOString(),
    };
  });

  const formattedAddresses = (user.addresses || []).map((addr) => ({
    id: addr.id,
    fullName: addr.fullName,
    phone: addr.phone,
    addressLine1: addr.addressLine1,
    addressLine2: addr.addressLine2,
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode,
    country: addr.country,
    isDefault: addr.isDefault,
  }));

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    orderCount,
    totalSpent: roundPrice(totalSpent),
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    addresses: formattedAddresses,
    orders: formattedOrders,
  };
};
