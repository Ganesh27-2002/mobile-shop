'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin@123', salt);
    const customerPasswordHash = await bcrypt.hash('Customer@123', salt);

    const now = new Date();

    const users = [
      {
        id: 'a1111111-1111-4111-8111-111111111111',
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@mobileshop.com',
        password: adminPasswordHash,
        phone: '+91 9876543210',
        role: 'ADMIN',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'a2222222-2222-4222-8222-222222222222',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        password: customerPasswordHash,
        phone: '+91 9876543211',
        role: 'CUSTOMER',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'a3333333-3333-4333-8333-333333333333',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        password: customerPasswordHash,
        phone: '+91 9876543212',
        role: 'CUSTOMER',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('users', users, { ignoreDuplicates: true });

    // Seed empty carts for the users
    const carts = [
      {
        id: 'b1111111-1111-4111-8111-111111111111',
        user_id: 'a1111111-1111-4111-8111-111111111111',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'b2222222-2222-4222-8222-222222222222',
        user_id: 'a2222222-2222-4222-8222-222222222222',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'b3333333-3333-4333-8333-333333333333',
        user_id: 'a3333333-3333-4333-8333-333333333333',
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('carts', carts, { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('carts', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
