import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

test.describe('Admin Dashboard API Tests (Step 8)', () => {
  let adminToken: string;
  let customerToken: string;

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
    expect(adminRes.status()).toBe(200);
    adminToken = (await adminRes.json()).data.token;

    // Login as Customer
    const custRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: customerCredentials,
    });
    expect(custRes.status()).toBe(200);
    customerToken = (await custRes.json()).data.token;
  });

  test('TEST 1: Unauthenticated request to /api/admin/dashboard returns 401 Unauthorized', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/dashboard`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('TEST 2: Customer user request to /api/admin/dashboard returns 403 Forbidden', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toContain('Admin privileges required');
  });

  test('TEST 3: Admin user request to /api/admin/dashboard returns 200 OK and valid structure', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('products');
    expect(body.data).toHaveProperty('orders');
    expect(body.data).toHaveProperty('customers');
    expect(body.data).toHaveProperty('revenue');
    expect(body.data).toHaveProperty('recentOrders');
    expect(body.data).toHaveProperty('lowStockProducts');
    expect(body.data).toHaveProperty('topProducts');
  });

  test('TEST 4: Dashboard contains accurate product statistics numbers', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const { data } = await res.json();
    expect(typeof data.products.total).toBe('number');
    expect(typeof data.products.active).toBe('number');
    expect(typeof data.products.lowStock).toBe('number');
    expect(typeof data.products.outOfStock).toBe('number');
    expect(data.products.total).toBeGreaterThanOrEqual(16);
    expect(data.products.active).toBeGreaterThan(0);
  });

  test('TEST 5: Dashboard contains order metrics breakdown', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const { data } = await res.json();
    expect(typeof data.orders.total).toBe('number');
    expect(typeof data.orders.pending).toBe('number');
    expect(typeof data.orders.completed).toBe('number');
    expect(typeof data.orders.cancelled).toBe('number');
  });

  test('TEST 6: Dashboard contains customer count matching registered customers', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const { data } = await res.json();
    expect(typeof data.customers.total).toBe('number');
    expect(data.customers.total).toBeGreaterThanOrEqual(2);
  });

  test('TEST 7: Dashboard contains computed revenue metric', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const { data } = await res.json();
    expect(typeof data.revenue.total).toBe('number');
    expect(data.revenue.total).toBeGreaterThanOrEqual(0);
  });

  test('TEST 8: Dashboard returns recent orders with customer and status details', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const { data } = await res.json();
    expect(Array.isArray(data.recentOrders)).toBe(true);
    if (data.recentOrders.length > 0) {
      const order = data.recentOrders[0];
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('orderNumber');
      expect(order).toHaveProperty('customer');
      expect(order.customer).toHaveProperty('name');
      expect(order.customer).toHaveProperty('email');
      expect(order).toHaveProperty('amount');
      expect(order).toHaveProperty('orderStatus');
    }
  });

  test('TEST 9: Dashboard returns low stock products list', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const { data } = await res.json();
    expect(Array.isArray(data.lowStockProducts)).toBe(true);
    for (const item of data.lowStockProducts) {
      expect(item.currentStock).toBeLessThanOrEqual(5);
      expect(['LOW STOCK', 'OUT OF STOCK']).toContain(item.status);
    }
  });
});
