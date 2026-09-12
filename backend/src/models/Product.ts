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
import type { Category } from './Category.js';
import type { CartItem } from './CartItem.js';
import type { OrderItem } from './OrderItem.js';

export class Product extends Model<InferAttributes<Product>, InferCreationAttributes<Product>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare slug: string;
  declare brand: string;
  declare model: string;
  declare description: string;
  declare price: number;
  declare originalPrice: number;
  declare discountPercentage: CreationOptional<number>;
  declare stock: CreationOptional<number>;
  declare image: string;
  declare categoryId: ForeignKey<string>;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations (NonAttribute)
  declare category?: NonAttribute<Category>;
  declare cartItems?: NonAttribute<CartItem[]>;
  declare orderItems?: NonAttribute<OrderItem[]>;
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('price');
        return val === null ? null : parseFloat(val as unknown as string);
      },
    },
    originalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'original_price',
      get() {
        const val = this.getDataValue('originalPrice');
        return val === null ? null : parseFloat(val as unknown as string);
      },
    },
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      field: 'discount_percentage',
      get() {
        const val = this.getDataValue('discountPercentage');
        return val === null ? null : parseFloat(val as unknown as string);
      },
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Relative frontend image path, e.g., /images/products/iphone-15.jpg',
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'category_id',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'is_active',
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
    tableName: 'products',
    underscored: true,
    timestamps: true,
  }
);
