'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const categories = [
      {
        id: 'c1111111-1111-4111-8111-111111111111',
        name: 'Apple',
        slug: 'apple',
        description: 'Premium iPhones engineered with industry-leading silicon, advanced cameras, and iOS ecosystem.',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'c2222222-2222-4222-8222-222222222222',
        name: 'Samsung',
        slug: 'samsung',
        description: 'Flagship Galaxy smartphones with vibrant Dynamic AMOLED displays, S-Pen capabilities, and Galaxy AI.',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'c3333333-3333-4333-8333-333333333333',
        name: 'OnePlus',
        slug: 'oneplus',
        description: 'Fast and smooth smartphones powered by Snapdragon processors and ultra-fast SUPERVOOC charging.',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'c4444444-4444-4444-8444-444444444444',
        name: 'Google',
        slug: 'google',
        description: 'Google Pixel smartphones with custom Tensor chips, pure Android experience, and cutting-edge computational photography.',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'c5555555-5555-4555-8555-555555555555',
        name: 'Xiaomi',
        slug: 'xiaomi',
        description: 'High-performance smartphones featuring Leica optical lenses, HyperOS, and exceptional value.',
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('categories', categories, { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('categories', null, {});
  },
};
