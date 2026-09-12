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
import type { Product } from './Product.js';

export class OrderItem extends Model<
  InferAttributes<OrderItem>,
  InferCreationAttributes<OrderItem>
> {
  declare id: CreationOptional<string>;
  declare orderId: ForeignKey<string>;
  declare productId: ForeignKey<string> | null;
  declare productName: string;
  declare productBrand: string;
  declare productImage: string;
  declare quantity: number;
  declare unitPrice: number;
  declare totalPrice: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations (NonAttribute)
  declare order?: NonAttribute<Order>;
  declare product?: NonAttribute<Product>;
}

OrderItem.init(
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
      field: 'order_id',
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'product_id',
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'product_name',
    },
    productBrand: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'product_brand',
    },
    productImage: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'product_image',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'unit_price',
      get() {
        const val = this.getDataValue('unitPrice');
        return val === null ? null : parseFloat(val as unknown as string);
      },
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_price',
      get() {
        const val = this.getDataValue('totalPrice');
        return val === null ? null : parseFloat(val as unknown as string);
      },
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
    tableName: 'order_items',
    underscored: true,
    timestamps: true,
  }
);
