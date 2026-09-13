import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

test.describe('Admin Customer Management API Tests (Step 8)', () => {
  let adminToken: string;
  let customerToken: string;
  let testCustomerId: string;

  const adminCredentials = {
    email: 'admin@mobileshop.com',
    password: 'Admin@123',
  };

  const customerCredentials = {
    email: 'john.doe@example.com',
    password: 'Customer@123',
  };

  test.beforeAll(async ({ request }) => {
    // Admin login
    const adminRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: adminCredentials,
    });
    adminToken = (await adminRes.json()).data.token;

    // Customer login
    const custRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: customerCredentials,
    });
    customerToken = (await custRes.json()).data.token;
  });

  test('TEST 1: Unauthenticated request to /api/admin/customers returns 401 Unauthorized', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/customers`);
    expect(res.status()).toBe(401);
  });

  test('TEST 2: Customer user request to /api/admin/customers returns 403 Forbidden', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/customers`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('TEST 3: Admin can list registered customers with metadata', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/customers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(2);
    testCustomerId = body.data[0].id;
  });

  test('TEST 4: Customer search by name returns matching accounts', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/customers?search=John`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.some((c: any) => c.fullName.includes('John') || c.email.includes('john'))).toBe(true);
  });

  test('TEST 5: Customer search by email returns matching accounts', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/customers?search=jane.smith@example.com`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].email).toBe('jane.smith@example.com');
  });

  test('TEST 6: Customer pagination returns structured pagination meta', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/customers?limit=1&page=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.pagination.limit).toBe(1);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.totalItems).toBeGreaterThanOrEqual(2);
  });

  test('TEST 7: Aggregated order count and total spent are present for each customer', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/customers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    for (const cust of body.data) {
      expect(typeof cust.orderCount).toBe('number');
      expect(typeof cust.totalSpent).toBe('number');
      expect(cust.totalSpent).toBeGreaterThanOrEqual(0);
    }
  });

  test('TEST 8: Admin can fetch detailed customer record with addresses and orders', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/customers/${testCustomerId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(testCustomerId);
    expect(body.data).toHaveProperty('addresses');
    expect(body.data).toHaveProperty('orders');
    expect(Array.isArray(body.data.addresses)).toBe(true);
    expect(Array.isArray(body.data.orders)).toBe(true);
  });

  test('TEST 9: Customer passwords, password hashes, and tokens are strictly excluded', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/customers/${testCustomerId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const { data } = await res.json();
    expect(data).not.toHaveProperty('password');
    expect(data).not.toHaveProperty('passwordHash');
    expect(data).not.toHaveProperty('token');
  });

  test('TEST 10: Customer user cannot access /api/admin/customers/:id', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/customers/${testCustomerId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(res.status()).toBe(403);
  });
});
