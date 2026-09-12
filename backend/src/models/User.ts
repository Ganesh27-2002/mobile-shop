import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../config/database.js';
import type { Cart } from './Cart.js';
import type { Address } from './Address.js';
import type { Order } from './Order.js';

export type UserRole = 'CUSTOMER' | 'ADMIN';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare password: string;
  declare phone: string | null;
  declare role: CreationOptional<UserRole>;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations (NonAttribute)
  declare cart?: NonAttribute<Cart>;
  declare addresses?: NonAttribute<Address[]>;
  declare orders?: NonAttribute<Order[]>;

  // Helper method to hide password from output
  toJSON() {
    const values = { ...this.get() };
    delete (values as Record<string, unknown>).password;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'last_name',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      set(value: string) {
        this.setDataValue('email', value.trim().toLowerCase());
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('CUSTOMER', 'ADMIN'),
      defaultValue: 'CUSTOMER',
      allowNull: false,
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
    tableName: 'users',
    underscored: true,
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ['password'] },
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] },
      },
    },
  }
);
