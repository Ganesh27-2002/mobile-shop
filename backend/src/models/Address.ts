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
import type { Order } from './Order.js';

export class Address extends Model<InferAttributes<Address>, InferCreationAttributes<Address>> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<string>;
  declare fullName: string;
  declare phone: string;
  declare addressLine1: string;
  declare addressLine2: string | null;
  declare city: string;
  declare state: string;
  declare postalCode: string;
  declare country: CreationOptional<string>;
  declare isDefault: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations (NonAttribute)
  declare user?: NonAttribute<User>;
  declare orders?: NonAttribute<Order[]>;
}

Address.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'full_name',
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressLine1: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'address_line1',
    },
    addressLine2: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'address_line2',
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'postal_code',
    },
    country: {
      type: DataTypes.STRING,
      defaultValue: 'India',
      allowNull: false,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_default',
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
    tableName: 'addresses',
    underscored: true,
    timestamps: true,
  }
);
