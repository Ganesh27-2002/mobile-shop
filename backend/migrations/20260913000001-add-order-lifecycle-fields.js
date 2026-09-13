'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add 'PLACED' to enum_orders_status if not already present
    try {
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname = 'enum_orders_status' AND e.enumlabel = 'PLACED'
          ) THEN
            ALTER TYPE "enum_orders_status" ADD VALUE 'PLACED' BEFORE 'CONFIRMED';
          END IF;
        END $$;
      `);
    } catch (e) {
      // Ignore if type doesn't exist or already modified
    }

    // 2. Add timestamp tracking columns to orders table
    await queryInterface.addColumn('orders', 'confirmed_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'processing_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'shipped_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'delivered_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'cancelled_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'cancellation_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('orders', 'cancellation_reason');
    await queryInterface.removeColumn('orders', 'cancelled_at');
    await queryInterface.removeColumn('orders', 'delivered_at');
    await queryInterface.removeColumn('orders', 'shipped_at');
    await queryInterface.removeColumn('orders', 'processing_at');
    await queryInterface.removeColumn('orders', 'confirmed_at');
  },
};
