import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../config/database.js';
import type { User } from './User.js';
import type { Address } from './Address.js';
import type { OrderItem } from './OrderItem.js';
import type { Payment } from './Payment.js';

export type OrderStatus =
  | 'PENDING'
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export class Order extends Model<InferAttributes<Order>, InferCreationAttributes<Order>> {
  declare id: CreationOptional<string>;
  declare orderNumber: string;
  declare userId: ForeignKey<string>;
  declare addressId: ForeignKey<string> | null;
  declare status: CreationOptional<OrderStatus>;
  declare subtotal: number;
  declare shippingAmount: CreationOptional<number>;
  declare totalAmount: number;
  declare confirmedAt?: CreationOptional<Date | null>;
  declare processingAt?: CreationOptional<Date | null>;
  declare shippedAt?: CreationOptional<Date | null>;
  declare deliveredAt?: CreationOptional<Date | null>;
  declare cancelledAt?: CreationOptional<Date | null>;
  declare cancellationReason?: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations (NonAttribute)
  declare user?: NonAttribute<User>;
  declare shippingAddress?: NonAttribute<Address>;
  declare items?: NonAttribute<OrderItem[]>;
  declare payment?: NonAttribute<Payment>;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'order_number',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    addressId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'address_id',
    },
    status: {
      type: DataTypes.ENUM(
        'PENDING',
        'PLACED',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED'
      ),
      defaultValue: 'PLACED',
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('subtotal');
        return val === null ? null : parseFloat(val as unknown as string);
      },
    },
    shippingAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
      allowNull: false,
      field: 'shipping_amount',
      get() {
        const val = this.getDataValue('shippingAmount');
        return val === null ? null : parseFloat(val as unknown as string);
      },
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount',
      get() {
        const val = this.getDataValue('totalAmount');
        return val === null ? null : parseFloat(val as unknown as string);
      },
    },
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'confirmed_at',
    },
    processingAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'processing_at',
    },
    shippedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'shipped_at',
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'delivered_at',
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'cancelled_at',
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'cancellation_reason',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'orders',
    underscored: true,
    timestamps: true,
  }
);
