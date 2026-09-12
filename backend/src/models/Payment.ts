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
import type { Order } from './Order.js';

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentProvider = 'RAZORPAY';

export class Payment extends Model<InferAttributes<Payment>, InferCreationAttributes<Payment>> {
  declare id: CreationOptional<string>;
  declare orderId: ForeignKey<string>;
  declare provider: CreationOptional<PaymentProvider>;
  declare providerOrderId: string | null;
  declare providerPaymentId: string | null;
  declare amount: number;
  declare currency: CreationOptional<string>;
  declare status: CreationOptional<PaymentStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations (NonAttribute)
  declare order?: NonAttribute<Order>;
}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'order_id',
    },
    provider: {
      type: DataTypes.ENUM('RAZORPAY'),
      defaultValue: 'RAZORPAY',
      allowNull: false,
    },
    providerOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'provider_order_id',
    },
    providerPaymentId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'provider_payment_id',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('amount');
        return val === null ? null : parseFloat(val as unknown as string);
      },
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'INR',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        'CREATED',
        'PENDING',
        'SUCCESS',
        'FAILED',
        'CANCELLED',
        'REFUNDED'
      ),
      defaultValue: 'CREATED',
      allowNull: false,
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
    tableName: 'payments',
    underscored: true,
    timestamps: true,
  }
);
