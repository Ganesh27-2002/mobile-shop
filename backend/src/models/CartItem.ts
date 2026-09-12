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
import type { Cart } from './Cart.js';
import type { Product } from './Product.js';

export class CartItem extends Model<InferAttributes<CartItem>, InferCreationAttributes<CartItem>> {
  declare id: CreationOptional<string>;
  declare cartId: ForeignKey<string>;
  declare productId: ForeignKey<string>;
  declare quantity: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations (NonAttribute)
  declare cart?: NonAttribute<Cart>;
  declare product?: NonAttribute<Product>;
}

CartItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    cartId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'cart_id',
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
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
    tableName: 'cart_items',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['cart_id', 'product_id'],
        name: 'unique_cart_product_idx',
      },
    ],
  }
);
