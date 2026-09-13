import type { Order } from '../models/Order.js';

export const ORDER_STATUS_FLOW = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;

export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [], // Terminal
  CANCELLED: [], // Terminal
};

export const CANCELLABLE_STATUSES: string[] = ['PLACED', 'PENDING', 'CONFIRMED', 'PROCESSING'];

export const isValidTransition = (fromStatus: string, toStatus: string): boolean => {
  const allowed = ORDER_STATUS_TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
};

export const isCancellable = (status: string): boolean => {
  return CANCELLABLE_STATUSES.includes(status);
};

export interface TimelineStep {
  status: string;
  title: string;
  completed: boolean;
  timestamp: string | null;
}

export interface OrderTrackingInfo {
  orderId: string;
  orderNumber: string;
  status: string;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  timeline: TimelineStep[];
}

export const buildOrderTimeline = (order: Order): OrderTrackingInfo => {
  const isCancelled = order.status === 'CANCELLED';
  const createdAtStr = order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString();
  const confirmedAtStr = order.confirmedAt ? new Date(order.confirmedAt).toISOString() : null;
  const processingAtStr = order.processingAt ? new Date(order.processingAt).toISOString() : null;
  const shippedAtStr = order.shippedAt ? new Date(order.shippedAt).toISOString() : null;
  const deliveredAtStr = order.deliveredAt ? new Date(order.deliveredAt).toISOString() : null;
  const cancelledAtStr = order.cancelledAt ? new Date(order.cancelledAt).toISOString() : null;

  if (isCancelled) {
    const timeline: TimelineStep[] = [
      {
        status: 'PLACED',
        title: 'Order Placed',
        completed: true,
        timestamp: createdAtStr,
      },
    ];

    if (confirmedAtStr) {
      timeline.push({
        status: 'CONFIRMED',
        title: 'Order Confirmed',
        completed: true,
        timestamp: confirmedAtStr,
      });
    }

    if (processingAtStr) {
      timeline.push({
        status: 'PROCESSING',
        title: 'Processing',
        completed: true,
        timestamp: processingAtStr,
      });
    }

    timeline.push({
      status: 'CANCELLED',
      title: 'Order Cancelled',
      completed: true,
      timestamp: cancelledAtStr || (order.updatedAt ? new Date(order.updatedAt).toISOString() : createdAtStr),
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      cancellationReason: order.cancellationReason || null,
      cancelledAt: cancelledAtStr,
      timeline,
    };
  }

  // Standard Lifecycle Flow
  const statusLevels: Record<string, number> = {
    PLACED: 1,
    PENDING: 1,
    CONFIRMED: 2,
    PROCESSING: 3,
    SHIPPED: 4,
    DELIVERED: 5,
  };

  const currentLevel = statusLevels[order.status] || 1;

  const timeline: TimelineStep[] = [
    {
      status: 'PLACED',
      title: 'Order Placed',
      completed: true,
      timestamp: createdAtStr,
    },
    {
      status: 'CONFIRMED',
      title: 'Order Confirmed',
      completed: currentLevel >= 2 || !!confirmedAtStr,
      timestamp: confirmedAtStr || (currentLevel >= 2 ? createdAtStr : null),
    },
    {
      status: 'PROCESSING',
      title: 'Processing',
      completed: currentLevel >= 3 || !!processingAtStr,
      timestamp: processingAtStr,
    },
    {
      status: 'SHIPPED',
      title: 'Shipped',
      completed: currentLevel >= 4 || !!shippedAtStr,
      timestamp: shippedAtStr,
    },
    {
      status: 'DELIVERED',
      title: 'Delivered',
      completed: currentLevel >= 5 || !!deliveredAtStr,
      timestamp: deliveredAtStr,
    },
  ];

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    cancellationReason: null,
    cancelledAt: null,
    timeline,
  };
};
