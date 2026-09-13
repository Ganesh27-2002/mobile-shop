import { Op, Order as SeqOrder } from 'sequelize';
import { Order, OrderItem, Payment, Address, User, Product } from '../models/index.js';
import { sequelize } from '../config/database.js';
import { AppError } from './authService.js';
import { DEFAULT_PAGE_LIMIT } from '../config/constants.js';
import { roundPrice } from '../utils/pricing.js';
import { updateOrderStatusSchema } from '../validators/adminValidator.js';
import { isValidTransition, buildOrderTimeline, OrderTrackingInfo, ORDER_STATUS_TRANSITIONS } from '../utils/orderStatus.js';

export interface AdminOrderQuery {
  search?: string;
  status?: string;
  paymentStatus?: string;
  sort?: string;
  page?: string | number;
  limit?: string | number;
}

export interface AdminOrderItemDetail {
  id: string;
  productId: string | null;
  productName: string;
  productBrand: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AdminOrderDetail {
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
  tracking?: OrderTrackingInfo;
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
  items: AdminOrderItemDetail[];
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

export interface PaginatedAdminOrders {
  orders: AdminOrderDetail[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const formatAdminOrder = (order: Order): AdminOrderDetail => {
  const subtotal = typeof order.subtotal === 'number' ? order.subtotal : parseFloat(String(order.subtotal || 0));
  const shippingAmount = typeof order.shippingAmount === 'number' ? order.shippingAmount : parseFloat(String(order.shippingAmount || 0));
  const totalAmount = typeof order.totalAmount === 'number' ? order.totalAmount : parseFloat(String(order.totalAmount || 0));
  const taxAmount = roundPrice(subtotal * 0.18);

  const customerObj = order.user;
  const paymentObj = order.payment;
  const addressObj = order.shippingAddress;

  const items: AdminOrderItemDetail[] = (order.items || []).map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productBrand: item.productBrand,
    productImage: item.productImage,
    quantity: item.quantity,
    unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(String(item.unitPrice || 0)),
    totalPrice: typeof item.totalPrice === 'number' ? item.totalPrice : parseFloat(String(item.totalPrice || 0)),
  }));

  const tracking = buildOrderTimeline(order);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    customer: {
      id: customerObj?.id || order.userId,
      name: customerObj ? `${customerObj.firstName} ${customerObj.lastName}`.trim() : 'Unknown Customer',
      email: customerObj?.email || 'N/A',
      phone: customerObj?.phone || null,
    },
    status: order.status,
    subtotal,
    shippingAmount,
    taxAmount,
    totalAmount,
    confirmedAt: order.confirmedAt ? new Date(order.confirmedAt).toISOString() : null,
    processingAt: order.processingAt ? new Date(order.processingAt).toISOString() : null,
    shippedAt: order.shippedAt ? new Date(order.shippedAt).toISOString() : null,
    deliveredAt: order.deliveredAt ? new Date(order.deliveredAt).toISOString() : null,
    cancelledAt: order.cancelledAt ? new Date(order.cancelledAt).toISOString() : null,
    cancellationReason: order.cancellationReason || null,
    createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: order.updatedAt?.toISOString() || new Date().toISOString(),
    tracking,
    shippingAddress: addressObj
      ? {
          id: addressObj.id,
          fullName: addressObj.fullName,
          phone: addressObj.phone,
          addressLine1: addressObj.addressLine1,
          addressLine2: addressObj.addressLine2,
          city: addressObj.city,
          state: addressObj.state,
          postalCode: addressObj.postalCode,
          country: addressObj.country,
        }
      : null,
    items,
    payment: paymentObj
      ? {
          id: paymentObj.id,
          provider: paymentObj.provider,
          providerOrderId: paymentObj.providerOrderId,
          providerPaymentId: paymentObj.providerPaymentId,
          amount: typeof paymentObj.amount === 'number' ? paymentObj.amount : parseFloat(String(paymentObj.amount || 0)),
          currency: paymentObj.currency,
          status: paymentObj.status,
          createdAt: paymentObj.createdAt?.toISOString() || new Date().toISOString(),
        }
      : null,
  };
};

export const getAdminOrders = async (query: AdminOrderQuery): Promise<PaginatedAdminOrders> => {
  const { search, status, paymentStatus, sort, page, limit } = query;

  const rawPage = parseInt(String(page || '1'), 10);
  const rawLimit = parseInt(String(limit || DEFAULT_PAGE_LIMIT), 10);

  const currentPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const currentLimit = isNaN(rawLimit) || rawLimit <= 0 ? DEFAULT_PAGE_LIMIT : Math.min(100, rawLimit);
  const offset = (currentPage - 1) * currentLimit;

  // Order status filter
  const statusFilter = status && status !== 'ALL' ? { status } : {};

  // Search filter across orderNumber, or customer name/email
  const orderWhere: Record<string, unknown> = {
    ...statusFilter,
  };

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    orderWhere[Op.or as unknown as string] = [
      { orderNumber: { [Op.iLike]: term } },
      { '$user.email$': { [Op.iLike]: term } },
      { '$user.first_name$': { [Op.iLike]: term } },
      { '$user.last_name$': { [Op.iLike]: term } },
    ];
  }

  // Payment status filter
  const paymentWhere = paymentStatus && paymentStatus !== 'ALL'
    ? { status: paymentStatus }
    : undefined;

  let selectedSort: SeqOrder = [['createdAt', 'DESC']];
  if (sort === 'oldest') {
    selectedSort = [['createdAt', 'ASC']];
  } else if (sort === 'amount_desc') {
    selectedSort = [['totalAmount', 'DESC']];
  } else if (sort === 'amount_asc') {
    selectedSort = [['totalAmount', 'ASC']];
  }

  const { count, rows } = await Order.findAndCountAll({
    where: orderWhere,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
      },
      {
        model: Address,
        as: 'shippingAddress',
      },
      {
        model: OrderItem,
        as: 'items',
      },
      {
        model: Payment,
        as: 'payment',
        required: !!paymentWhere,
        where: paymentWhere,
      },
    ],
    order: selectedSort,
    limit: currentLimit,
    offset,
    distinct: true,
    subQuery: false,
  });

  const totalPages = Math.ceil(count / currentLimit) || 1;

  return {
    orders: rows.map(formatAdminOrder),
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

export const getAdminOrderById = async (orderId: string): Promise<AdminOrderDetail> => {
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
      },
      {
        model: Address,
        as: 'shippingAddress',
      },
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

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  return formatAdminOrder(order);
};

export const updateOrderStatus = async (orderId: string, input: unknown): Promise<AdminOrderDetail> => {
  const parseResult = updateOrderStatusSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((e) => e.message).join(', ');
    throw new AppError(errorMsg, 400);
  }

  const { status: targetStatus, cancellationReason } = parseResult.data;

  return await sequelize.transaction(async (t) => {
    const order = await Order.findByPk(orderId, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const currentStatus = order.status;

    if (currentStatus === targetStatus) {
      const currentOrder = await getAdminOrderById(orderId);
      return currentOrder;
    }

    const allowedNextStatuses = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
    if (!isValidTransition(currentStatus, targetStatus)) {
      throw new AppError(
        `Invalid order status transition from "${currentStatus}" to "${targetStatus}". Allowed transitions: [${allowedNextStatuses.join(', ')}]`,
        400
      );
    }

    const now = new Date();

    if (targetStatus === 'CANCELLED') {
      // Restore inventory
      const items = await OrderItem.findAll({
        where: { orderId: order.id },
        transaction: t,
      });

      for (const item of items) {
        if (item.productId) {
          const product = await Product.findByPk(item.productId, {
            lock: t.LOCK.UPDATE,
            transaction: t,
          });
          if (product) {
            product.stock += item.quantity;
            await product.save({ transaction: t });
          }
        }
      }

      order.status = 'CANCELLED';
      order.cancelledAt = now;
      order.cancellationReason = cancellationReason || 'Cancelled by store administrator';
      await order.save({ transaction: t });
    } else {
      if (targetStatus === 'CONFIRMED') {
        if (!order.confirmedAt) order.confirmedAt = now;
      } else if (targetStatus === 'PROCESSING') {
        if (!order.confirmedAt) order.confirmedAt = now;
        order.processingAt = now;
      } else if (targetStatus === 'SHIPPED') {
        if (!order.confirmedAt) order.confirmedAt = now;
        if (!order.processingAt) order.processingAt = now;
        order.shippedAt = now;
      } else if (targetStatus === 'DELIVERED') {
        if (!order.confirmedAt) order.confirmedAt = now;
        if (!order.processingAt) order.processingAt = now;
        if (!order.shippedAt) order.shippedAt = now;
        order.deliveredAt = now;
      }

      order.status = targetStatus as typeof order.status;
      await order.save({ transaction: t });
    }

    const updated = await Order.findByPk(order.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        },
        {
          model: Address,
          as: 'shippingAddress',
        },
        {
          model: OrderItem,
          as: 'items',
        },
        {
          model: Payment,
          as: 'payment',
        },
      ],
      transaction: t,
    });

    return formatAdminOrder(updated!);
  });
};
