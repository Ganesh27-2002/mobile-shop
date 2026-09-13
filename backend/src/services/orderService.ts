import { Order, OrderItem, Payment, Address, Cart, CartItem, Product } from '../models/index.js';
import { sequelize } from '../config/database.js';
import { AppError } from './authService.js';
import { createOrderSchema, cancelOrderSchema } from '../validators/orderValidator.js';
import { calculatePricing, roundPrice } from '../utils/pricing.js';
import { buildOrderTimeline, OrderTrackingInfo, isCancellable } from '../utils/orderStatus.js';
import * as paymentService from './paymentService.js';

export interface FormattedOrderItem {
  id: string;
  productId: string | null;
  productName: string;
  productBrand: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface FormattedPayment {
  id: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface FormattedOrderAddress {
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

export interface FormattedOrder {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  subtotal: number;
  shippingAmount: number;
  totalAmount: number;
  taxAmount: number;
  confirmedAt?: string | null;
  processingAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  shippingAddress: FormattedOrderAddress | null;
  items: FormattedOrderItem[];
  payment: FormattedPayment | null;
}

export const formatOrder = (order: Order): FormattedOrder => {
  const subtotal = typeof order.subtotal === 'number' ? order.subtotal : parseFloat(String(order.subtotal || 0));
  const shippingAmount = typeof order.shippingAmount === 'number' ? order.shippingAmount : parseFloat(String(order.shippingAmount || 0));
  const totalAmount = typeof order.totalAmount === 'number' ? order.totalAmount : parseFloat(String(order.totalAmount || 0));
  const taxAmount = roundPrice(subtotal * 0.18);

  const items: FormattedOrderItem[] = (order.items || []).map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productBrand: item.productBrand,
    productImage: item.productImage,
    quantity: item.quantity,
    unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(String(item.unitPrice || 0)),
    totalPrice: typeof item.totalPrice === 'number' ? item.totalPrice : parseFloat(String(item.totalPrice || 0)),
  }));

  const shippingAddress: FormattedOrderAddress | null = order.shippingAddress
    ? {
        id: order.shippingAddress.id,
        fullName: order.shippingAddress.fullName,
        phone: order.shippingAddress.phone,
        addressLine1: order.shippingAddress.addressLine1,
        addressLine2: order.shippingAddress.addressLine2,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
      }
    : null;

  const payment: FormattedPayment | null = order.payment
    ? {
        id: order.payment.id,
        provider: order.payment.provider,
        providerOrderId: order.payment.providerOrderId,
        providerPaymentId: order.payment.providerPaymentId,
        amount: typeof order.payment.amount === 'number' ? order.payment.amount : parseFloat(String(order.payment.amount || 0)),
        currency: order.payment.currency,
        status: order.payment.status,
        createdAt: order.payment.createdAt?.toISOString() || new Date().toISOString(),
      }
    : null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId,
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
    shippingAddress,
    items,
    payment,
  };
};

/**
 * Generates human-friendly, unique order number.
 * Format: MS-YYYYMMDD-XXXXXX
 */
export const generateOrderNumber = (): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MS-${dateStr}-${randomSuffix}`;
};

/**
 * Places an order within a single atomic database transaction.
 */
export const createOrder = async (userId: string, input: unknown): Promise<FormattedOrder> => {
  const parseResult = createOrderSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((e) => e.message).join(', ');
    throw new AppError(errorMsg, 400);
  }

  const { addressId, paymentMethod, cardDetails } = parseResult.data;

  // 1. Verify address ownership
  const address = await Address.findOne({
    where: { id: addressId, userId },
  });

  if (!address) {
    throw new AppError('Shipping address not found or does not belong to you', 404);
  }

  return await sequelize.transaction(async (t) => {
    // 2. Fetch cart with items and lock products
    const cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
            },
          ],
        },
      ],
      transaction: t,
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new AppError('Your cart is empty. Add products before placing an order.', 400);
    }

    // 3. Validate stock & calculate subtotal
    let subtotal = 0;
    for (const item of cart.items) {
      if (!item.product || !item.product.isActive) {
        throw new AppError(`Product "${item.product?.name || 'Unknown'}" is no longer available.`, 400);
      }

      if (item.product.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${item.product.name}". Available: ${item.product.stock}, Requested: ${item.quantity}`,
          400
        );
      }

      const itemUnitPrice = typeof item.product.price === 'number' ? item.product.price : parseFloat(String(item.product.price));
      const lineTotal = roundPrice(itemUnitPrice * item.quantity);
      subtotal = roundPrice(subtotal + lineTotal);
    }

    // 4. Calculate final pricing
    const pricing = calculatePricing(subtotal);

    // 5. Process Payment (simulated)
    const paymentResult = paymentService.processDummyPayment({
      paymentMethod,
      amount: pricing.totalAmount,
      cardDetails,
    });

    // 6. Generate order number and create Order record
    const orderNumber = generateOrderNumber();
    const now = new Date();
    const order = await Order.create(
      {
        orderNumber,
        userId,
        addressId: address.id,
        status: 'CONFIRMED',
        confirmedAt: now,
        subtotal: pricing.subtotal,
        shippingAmount: pricing.shippingAmount,
        totalAmount: pricing.totalAmount,
      },
      { transaction: t }
    );

    // 7. Create OrderItems and Decrement Stock
    for (const item of cart.items) {
      const product = item.product!;
      const unitPrice = typeof product.price === 'number' ? product.price : parseFloat(String(product.price));
      const totalPrice = roundPrice(unitPrice * item.quantity);

      await OrderItem.create(
        {
          orderId: order.id,
          productId: product.id,
          productName: product.name,
          productBrand: product.brand,
          productImage: product.image,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        },
        { transaction: t }
      );

      // Decrement inventory
      product.stock -= item.quantity;
      await product.save({ transaction: t });
    }

    // 8. Create Payment record
    await Payment.create(
      {
        orderId: order.id,
        provider: paymentResult.provider,
        providerOrderId: paymentResult.providerOrderId,
        providerPaymentId: paymentResult.providerPaymentId,
        amount: paymentResult.amount,
        currency: paymentResult.currency,
        status: paymentResult.status,
      },
      { transaction: t }
    );

    // 9. Clear user's cart items
    await CartItem.destroy({
      where: { cartId: cart.id },
      transaction: t,
    });

    // 10. Fetch fully populated created order
    const completedOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
        {
          model: Address,
          as: 'shippingAddress',
        },
        {
          model: Payment,
          as: 'payment',
        },
      ],
      transaction: t,
    });

    return formatOrder(completedOrder!);
  });
};

/**
 * Retrieves all orders for the authenticated user.
 */
export const getOrders = async (userId: string): Promise<FormattedOrder[]> => {
  const orders = await Order.findAll({
    where: { userId },
    include: [
      {
        model: OrderItem,
        as: 'items',
      },
      {
        model: Address,
        as: 'shippingAddress',
      },
      {
        model: Payment,
        as: 'payment',
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  return orders.map(formatOrder);
};

/**
 * Retrieves a single order by ID for the authenticated user.
 */
export const getOrderById = async (userId: string, orderId: string): Promise<FormattedOrder> => {
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: OrderItem,
        as: 'items',
      },
      {
        model: Address,
        as: 'shippingAddress',
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

  if (order.userId !== userId) {
    throw new AppError('Order not found', 404);
  }

  return formatOrder(order);
};

/**
 * Tracks order progress and returns the complete status timeline.
 */
export const trackOrder = async (userId: string, orderId: string): Promise<OrderTrackingInfo> => {
  const order = await Order.findByPk(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.userId !== userId) {
    throw new AppError('Unauthorized access to track this order', 403);
  }

  return buildOrderTimeline(order);
};

/**
 * Atomically cancels an eligible customer order and restores inventory stock.
 */
export const cancelOrder = async (userId: string, orderId: string, input: unknown): Promise<FormattedOrder> => {
  const parseResult = cancelOrderSchema.safeParse(input || {});
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((e) => e.message).join(', ');
    throw new AppError(errorMsg, 400);
  }

  const { reason } = parseResult.data;

  return await sequelize.transaction(async (t) => {
    // 1. Lock and load order
    const order = await Order.findByPk(orderId, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // 2. Verify ownership
    if (order.userId !== userId) {
      throw new AppError('Unauthorized to cancel this order', 403);
    }

    // 3. Verify status cancellability
    if (order.status === 'CANCELLED') {
      throw new AppError('Order is already cancelled.', 400);
    }

    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      throw new AppError(`Cannot cancel order with status "${order.status}". Orders that are shipped or delivered cannot be cancelled.`, 400);
    }

    if (!isCancellable(order.status)) {
      throw new AppError(`Cannot cancel order with status "${order.status}".`, 400);
    }

    // 4. Fetch OrderItems and restore inventory
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

    // 5. Update Order status and timestamps
    const now = new Date();
    order.status = 'CANCELLED';
    order.cancelledAt = now;
    order.cancellationReason = reason ? reason.trim() : null;
    await order.save({ transaction: t });

    // 6. Return refreshed order
    const cancelledOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
        {
          model: Address,
          as: 'shippingAddress',
        },
        {
          model: Payment,
          as: 'payment',
        },
      ],
      transaction: t,
    });

    return formatOrder(cancelledOrder!);
  });
};
