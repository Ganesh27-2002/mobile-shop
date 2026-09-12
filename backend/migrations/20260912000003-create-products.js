'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      model: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      original_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      discount_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
        allowNull: false,
      },
      stock: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      image: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Relative frontend image path, e.g., /images/products/iphone-15.jpg',
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    await queryInterface.addIndex('products', ['slug'], {
      unique: true,
      name: 'products_slug_unique',
    });
    await queryInterface.addIndex('products', ['category_id'], {
      name: 'products_category_id_idx',
    });
    await queryInterface.addIndex('products', ['brand'], {
      name: 'products_brand_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  },
};
