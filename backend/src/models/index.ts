import { sequelize } from '../config/database.js';
import { User } from './User.js';
import { Category } from './Category.js';
import { Product } from './Product.js';
import { Cart } from './Cart.js';
import { CartItem } from './CartItem.js';
import { Address } from './Address.js';
import { Order } from './Order.js';
import { OrderItem } from './OrderItem.js';
import { Payment } from './Payment.js';

// ==========================================
// User Relationships
// ==========================================
// A user has one active cart. When a user is deleted, their cart is also deleted.
User.hasOne(Cart, {
  foreignKey: 'userId',
  as: 'cart',
  onDelete: 'CASCADE',
});
Cart.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// A user can save multiple shipping/billing addresses.
User.hasMany(Address, {
  foreignKey: 'userId',
  as: 'addresses',
  onDelete: 'CASCADE',
});
Address.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// A user can place multiple orders over time.
User.hasMany(Order, {
  foreignKey: 'userId',
  as: 'orders',
  onDelete: 'RESTRICT',
});
Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// ==========================================
// Address Relationships
// ==========================================
// An order is delivered to a specific saved address.
Address.hasMany(Order, {
  foreignKey: 'addressId',
  as: 'orders',
  onDelete: 'SET NULL',
});
Order.belongsTo(Address, {
  foreignKey: 'addressId',
  as: 'shippingAddress',
});

// ==========================================
// Category & Product Relationships
// ==========================================
// A category contains multiple products (e.g., Apple, Samsung).
Category.hasMany(Product, {
  foreignKey: 'categoryId',
  as: 'products',
  onDelete: 'RESTRICT',
});
Product.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
});

// ==========================================
// Cart & CartItem Relationships
// ==========================================
// A cart contains multiple line items.
Cart.hasMany(CartItem, {
  foreignKey: 'cartId',
  as: 'items',
  onDelete: 'CASCADE',
});
CartItem.belongsTo(Cart, {
  foreignKey: 'cartId',
  as: 'cart',
});

// A product can be referenced by items in multiple user carts.
Product.hasMany(CartItem, {
  foreignKey: 'productId',
  as: 'cartItems',
  onDelete: 'CASCADE',
});
CartItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

// ==========================================
// Order, OrderItem & Payment Relationships
// ==========================================
// An order consists of one or more order item snapshots.
Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  as: 'items',
  onDelete: 'CASCADE',
});
OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

// An order item references the source product (can be null if product is discontinued).
Product.hasMany(OrderItem, {
  foreignKey: 'productId',
  as: 'orderItems',
  onDelete: 'SET NULL',
});
OrderItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

// An order has one payment transaction record.
Order.hasOne(Payment, {
  foreignKey: 'orderId',
  as: 'payment',
  onDelete: 'CASCADE',
});
Payment.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

export {
  sequelize,
  User,
  Category,
  Product,
  Cart,
  CartItem,
  Address,
  Order,
  OrderItem,
  Payment,
};
