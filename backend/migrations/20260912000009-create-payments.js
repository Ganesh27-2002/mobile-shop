'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      provider: {
        type: Sequelize.ENUM('RAZORPAY'),
        defaultValue: 'RAZORPAY',
        allowNull: false,
      },
      provider_order_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      provider_payment_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(10),
        defaultValue: 'INR',
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
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

    await queryInterface.addIndex('payments', ['order_id'], {
      unique: true,
      name: 'payments_order_id_unique',
    });
    await queryInterface.addIndex('payments', ['status'], {
      name: 'payments_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payments');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_provider";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_status";');
  },
};
