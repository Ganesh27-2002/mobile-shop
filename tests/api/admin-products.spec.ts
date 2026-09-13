import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

test.describe('Admin Product Management API Tests (Step 8)', () => {
  test.describe.configure({ mode: 'serial' });

  let adminToken: string;
  let customerToken: string;
  let categoryId: string;
  let createdProductId: string;

  const adminCredentials = {
    email: 'admin@mobileshop.com',
    password: 'Admin@123',
  };

  const customerCredentials = {
    email: 'john.doe@example.com',
    password: 'Customer@123',
  };

  test.beforeAll(async ({ request }) => {
    // Login as Admin
    const adminRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: adminCredentials,
    });
    adminToken = (await adminRes.json()).data.token;

    // Login as Customer
    const custRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: customerCredentials,
    });
    customerToken = (await custRes.json()).data.token;

    // Get Apple category ID
    const catRes = await request.get(`${API_BASE_URL}/api/categories`);
    const cats = (await catRes.json()).data.categories;
    const appleCat = cats.find((c: any) => c.slug === 'apple') || cats[0];
    categoryId = appleCat.id;
  });

  test.afterAll(async ({ request }) => {
    if (createdProductId && adminToken) {
      await request.delete(`${API_BASE_URL}/api/admin/products/${createdProductId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
  });

  test('TEST 1: Unauthenticated request to /api/admin/products returns 401 Unauthorized', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/products`);
    expect(res.status()).toBe(401);
  });

  test('TEST 2: Customer user request to /api/admin/products returns 403 Forbidden', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/products`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('TEST 3: Admin can list all products with pagination and category inclusion', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/products`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body).toHaveProperty('pagination');
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('category');
  });

  test('TEST 4: Admin can retrieve allowed local product images', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/products/images`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toContain('/images/products/iphone-15-pro-max.jpg');
  });

  test('TEST 5: Admin can create a new smartphone product', async ({ request }) => {
    const newProduct = {
      name: 'Apple iPhone 16 Pro Max Test',
      brand: 'Apple',
      model: '256GB Desert Titanium',
      description: 'Next-generation A18 Pro flagship device',
      price: 139999,
      originalPrice: 149999,
      discountPercentage: 6,
      stock: 25,
      image: '/images/products/iphone-15-pro-max.jpg',
      categoryId,
      isActive: true,
    };

    const res = await request.post(`${API_BASE_URL}/api/admin/products`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: newProduct,
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Apple iPhone 16 Pro Max Test');
    expect(body.data.price).toBe(139999);
    expect(body.data.stock).toBe(25);
    createdProductId = body.data.id;
  });

  test('TEST 6: Product creation fails with invalid or missing required fields', async ({ request }) => {
    const invalidProduct = {
      brand: 'Google',
      price: -500, // Invalid negative price
      stock: -5, // Invalid negative stock
      image: '',
    };

    const res = await request.post(`${API_BASE_URL}/api/admin/products`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: invalidProduct,
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('TEST 7: Product creation fails with non-existent category ID', async ({ request }) => {
    const nonExistentCat = {
      name: 'Test Phone',
      brand: 'TestBrand',
      model: 'TestModel',
      price: 50000,
      stock: 10,
      image: '/images/products/iphone-15.jpg',
      categoryId: 'd9999999-9999-4999-8999-999999999999',
    };

    const res = await request.post(`${API_BASE_URL}/api/admin/products`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: nonExistentCat,
    });
    expect(res.status()).toBe(404);
  });

  test('TEST 8: Admin can update product details', async ({ request }) => {
    const updateData = {
      name: 'Apple iPhone 16 Pro Max (Updated)',
      price: 134999,
      description: 'Updated specs and description',
    };

    const res = await request.put(`${API_BASE_URL}/api/admin/products/${createdProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: updateData,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe('Apple iPhone 16 Pro Max (Updated)');
    expect(body.data.price).toBe(134999);
  });

  test('TEST 9: Admin can update stock quantity', async ({ request }) => {
    const res = await request.patch(`${API_BASE_URL}/api/admin/products/${createdProductId}/stock`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { stock: 42 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.newStock).toBe(42);
    expect(body.data.stockDifference).toBe(17); // 42 - 25
  });

  test('TEST 10: Stock update rejects negative stock values', async ({ request }) => {
    const res = await request.patch(`${API_BASE_URL}/api/admin/products/${createdProductId}/stock`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { stock: -10 },
    });
    expect(res.status()).toBe(400);
  });

  test('TEST 11: Admin can deactivate and activate product status', async ({ request }) => {
    // Deactivate
    const deactRes = await request.patch(`${API_BASE_URL}/api/admin/products/${createdProductId}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { isActive: false },
    });
    expect(deactRes.status()).toBe(200);
    expect((await deactRes.json()).data.isActive).toBe(false);

    // Verify it is hidden from public /api/products
    const publicRes = await request.get(`${API_BASE_URL}/api/products/${createdProductId}`);
    expect(publicRes.status()).toBe(404);

    // Reactivate
    const reactRes = await request.patch(`${API_BASE_URL}/api/admin/products/${createdProductId}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { isActive: true },
    });
    expect(reactRes.status()).toBe(200);
    expect((await reactRes.json()).data.isActive).toBe(true);
  });

  test('TEST 12: Product search returns matching results', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/products?search=iPhone%2016`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.some((p: any) => p.name.includes('iPhone 16'))).toBe(true);
  });

  test('TEST 13: Product category filter works', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/products?category=apple`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.every((p: any) => p.category?.slug === 'apple')).toBe(true);
  });

  test('TEST 14: Product pagination calculates total pages correctly', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/products?limit=5&page=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.pagination.limit).toBe(5);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.totalPages).toBeGreaterThan(1);
  });
});
