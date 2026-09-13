import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

test.describe('Admin Category Management API Tests (Step 8)', () => {
  let adminToken: string;
  let customerToken: string;
  let createdCategoryId: string;

  const adminCredentials = {
    email: 'admin@mobileshop.com',
    password: 'Admin@123',
  };

  const customerCredentials = {
    email: 'john.doe@example.com',
    password: 'Customer@123',
  };

  test.beforeAll(async ({ request }) => {
    const adminRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: adminCredentials,
    });
    adminToken = (await adminRes.json()).data.token;

    const custRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: customerCredentials,
    });
    customerToken = (await custRes.json()).data.token;
  });

  test('TEST 1: Unauthenticated request to /api/admin/categories returns 401 Unauthorized', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/categories`);
    expect(res.status()).toBe(401);
  });

  test('TEST 2: Customer user request to /api/admin/categories returns 403 Forbidden', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/categories`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('TEST 3: Admin can list all categories with product count summary', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('productCount');
    expect(typeof body.data[0].productCount).toBe('number');
  });

  test('TEST 4: Admin can create a new category', async ({ request }) => {
    const newCat = {
      name: 'Sony Xperia Series',
      slug: 'sony-xperia',
      description: 'Premium photography and multimedia smartphones',
    };

    const res = await request.post(`${API_BASE_URL}/api/admin/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: newCat,
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Sony Xperia Series');
    expect(body.data.slug).toBe('sony-xperia');
    createdCategoryId = body.data.id;
  });

  test('TEST 5: Duplicate category name or slug is rejected with 409 Conflict', async ({ request }) => {
    const duplicateCat = {
      name: 'Sony Xperia Series',
      slug: 'sony-xperia',
    };

    const res = await request.post(`${API_BASE_URL}/api/admin/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: duplicateCat,
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('TEST 6: Admin can fetch a single category by ID', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/categories/${createdCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(createdCategoryId);
  });

  test('TEST 7: Admin can update category details', async ({ request }) => {
    const res = await request.put(`${API_BASE_URL}/api/admin/categories/${createdCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: 'Sony Xperia Premium Series',
        description: 'Updated cinema-grade 4K smartphones',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe('Sony Xperia Premium Series');
  });

  test('TEST 8: Deleting a category with existing products is rejected with 400 Bad Request', async ({ request }) => {
    // Fetch an existing populated category (e.g. Apple)
    const catRes = await request.get(`${API_BASE_URL}/api/admin/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const categories = (await catRes.json()).data;
    const populatedCat = categories.find((c: any) => c.productCount > 0);
    expect(populatedCat).toBeDefined();

    const res = await request.delete(`${API_BASE_URL}/api/admin/categories/${populatedCat.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toContain('contains');
  });

  test('TEST 9: Admin can delete an empty category', async ({ request }) => {
    const res = await request.delete(`${API_BASE_URL}/api/admin/categories/${createdCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify deletion
    const verifyRes = await request.get(`${API_BASE_URL}/api/admin/categories/${createdCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(verifyRes.status()).toBe(404);
  });
});
