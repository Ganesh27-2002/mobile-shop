'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      order_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      address_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'addresses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM(
          'PENDING',
          'CONFIRMED',
          'PROCESSING',
          'SHIPPED',
          'DELIVERED',
          'CANCELLED'
        ),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      shipping_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0,
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('orders', ['order_number'], {
      unique: true,
      name: 'orders_order_number_unique',
    });
    await queryInterface.addIndex('orders', ['user_id'], {
      name: 'orders_user_id_idx',
    });
    await queryInterface.addIndex('orders', ['status'], {
      name: 'orders_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('orders');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status";');
  },
};
