import { Op } from 'sequelize';
import { Product, Order, OrderItem, User, Category, Payment } from '../models/index.js';
import { LOW_STOCK_THRESHOLD } from '../config/constants.js';
import { roundPrice } from '../utils/pricing.js';

export interface DashboardData {
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

export const getDashboardStats = async (): Promise<DashboardData> => {
  // 1. Products statistics
  const [totalProducts, activeProducts, lowStockCount, outOfStockCount] = await Promise.all([
    Product.count(),
    Product.count({ where: { isActive: true } }),
    Product.count({
      where: {
        stock: {
          [Op.lte]: LOW_STOCK_THRESHOLD,
          [Op.gt]: 0,
        },
      },
    }),
    Product.count({
      where: {
        stock: 0,
      },
    }),
  ]);

  // 2. Orders statistics
  const [totalOrders, pendingOrders, completedOrders, cancelledOrders] = await Promise.all([
    Order.count(),
    Order.count({ where: { status: 'PENDING' } }),
    Order.count({
      where: {
        status: {
          [Op.in]: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
      },
    }),
    Order.count({ where: { status: 'CANCELLED' } }),
  ]);

  // 3. Customers count
  const totalCustomers = await User.count({
    where: { role: 'CUSTOMER' },
  });

  // 4. Total revenue (sum of non-cancelled orders)
  const revenueSum = await Order.sum('totalAmount', {
    where: {
      status: {
        [Op.ne]: 'CANCELLED',
      },
    },
  });
  const totalRevenue = revenueSum ? roundPrice(Number(revenueSum)) : 0;

  // 5. Recent orders (latest 5)
  const recentOrdersRaw = await Order.findAll({
    limit: 5,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: Payment,
        as: 'payment',
        attributes: ['provider', 'status'],
      },
    ],
  });

  const recentOrders = recentOrdersRaw.map((order) => {
    const userObj = order.user;
    const paymentObj = order.payment;
    const amountVal = typeof order.totalAmount === 'number' ? order.totalAmount : parseFloat(String(order.totalAmount || 0));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customer: {
        id: userObj?.id || order.userId,
        name: userObj ? `${userObj.firstName} ${userObj.lastName}`.trim() : 'Unknown Customer',
        email: userObj?.email || 'N/A',
      },
      date: order.createdAt?.toISOString() || new Date().toISOString(),
      amount: amountVal,
      paymentMethod: paymentObj?.provider || 'N/A',
      paymentStatus: paymentObj?.status || 'PENDING',
      orderStatus: order.status,
    };
  });

  // 6. Low stock products (stock <= LOW_STOCK_THRESHOLD)
  const lowStockRaw = await Product.findAll({
    where: {
      stock: {
        [Op.lte]: LOW_STOCK_THRESHOLD,
      },
    },
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
      },
    ],
    order: [['stock', 'ASC']],
    limit: 10,
  });

  const lowStockProducts = lowStockRaw.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    model: p.model,
    category: p.category?.name || 'Uncategorized',
    currentStock: p.stock,
    threshold: LOW_STOCK_THRESHOLD,
    status: (p.stock === 0 ? 'OUT OF STOCK' : 'LOW STOCK') as 'LOW STOCK' | 'OUT OF STOCK',
  }));

  // 7. Top selling products
  const topItemsRaw = await OrderItem.findAll({
    attributes: [
      'productName',
      'productBrand',
      'productId',
      [OrderItem.sequelize!.fn('SUM', OrderItem.sequelize!.col('quantity')), 'unitsSold'],
      [OrderItem.sequelize!.fn('SUM', OrderItem.sequelize!.col('total_price')), 'revenue'],
    ],
    include: [
      {
        model: Order,
        as: 'order',
        attributes: [],
        where: {
          status: {
            [Op.ne]: 'CANCELLED',
          },
        },
      },
    ],
    group: ['OrderItem.product_name', 'OrderItem.product_brand', 'OrderItem.product_id'],
    order: [[OrderItem.sequelize!.literal('"unitsSold"'), 'DESC']],
    limit: 5,
    raw: true,
  });

  const topProducts = (topItemsRaw as unknown as Array<{
    productName: string;
    productBrand: string;
    productId: string | null;
    unitsSold: string | number;
    revenue: string | number;
  }>).map((item) => ({
    id: item.productId,
    name: item.productName,
    brand: item.productBrand,
    unitsSold: parseInt(String(item.unitsSold || 0), 10),
    revenue: roundPrice(parseFloat(String(item.revenue || 0))),
  }));

  return {
    products: {
      total: totalProducts,
      active: activeProducts,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
    },
    orders: {
      total: totalOrders,
      pending: pendingOrders,
      completed: completedOrders,
      cancelled: cancelledOrders,
    },
    customers: {
      total: totalCustomers,
    },
    revenue: {
      total: totalRevenue,
    },
    recentOrders,
    lowStockProducts,
    topProducts,
  };
};
