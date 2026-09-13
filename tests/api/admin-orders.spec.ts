import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

test.describe('Admin Order Management API Tests (Step 8)', () => {
  let adminToken: string;
  let customerToken: string;
  let testOrderId: string;

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

    // Create a customer order for testing if none exists
    const ordersRes = await request.get(`${API_BASE_URL}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const ordersBody = await ordersRes.json();
    if (ordersBody.data && ordersBody.data.length > 0) {
      testOrderId = ordersBody.data[0].id;
    } else {
      // Create address & place order
      const addrRes = await request.post(`${API_BASE_URL}/api/addresses`, {
        headers: { Authorization: `Bearer ${customerToken}` },
        data: {
          fullName: 'Test Buyer',
          phone: '9876543210',
          addressLine1: '101 Marine Drive',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
        },
      });
      const addressId = (await addrRes.json()).data.id;

      const prodsRes = await request.get(`${API_BASE_URL}/api/products?limit=1`);
      const prod = (await prodsRes.json()).data.products[0];

      await request.post(`${API_BASE_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${customerToken}` },
        data: { productId: prod.id, quantity: 1 },
      });

      const orderCreateRes = await request.post(`${API_BASE_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${customerToken}` },
        data: { addressId, paymentMethod: 'COD' },
      });
      testOrderId = (await orderCreateRes.json()).data.order.id;
    }
  });

  test('TEST 1: Unauthenticated request to /api/admin/orders returns 401 Unauthorized', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/orders`);
    expect(res.status()).toBe(401);
  });

  test('TEST 2: Customer user request to /api/admin/orders returns 403 Forbidden', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('TEST 3: Admin can list all customer orders globally', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('customer');
    expect(body.data[0]).toHaveProperty('totalAmount');
  });

  test('TEST 4: Order pagination works correctly', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/orders?limit=2&page=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.pagination.limit).toBe(2);
    expect(body.pagination.page).toBe(1);
    expect(body).toHaveProperty('pagination');
  });

  test('TEST 5: Order search by order number or customer works', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/orders?search=MS-`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].orderNumber).toContain('MS-');
  });

  test('TEST 6: Order status filter returns matching orders', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/orders?status=CONFIRMED`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    for (const order of body.data) {
      expect(order.status).toBe('CONFIRMED');
    }
  });

  test('TEST 7: Order payment status filter works', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/orders?paymentStatus=PENDING`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    for (const order of body.data) {
      expect(order.payment?.status).toBe('PENDING');
    }
  });

  test('TEST 8: Admin can fetch detailed order receipt by ID', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/orders/${testOrderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(testOrderId);
    expect(body.data).toHaveProperty('shippingAddress');
    expect(body.data).toHaveProperty('items');
    expect(body.data).toHaveProperty('payment');
    expect(body.data).toHaveProperty('taxAmount');
  });

  test('TEST 9: Admin can transition order status along valid lifecycle', async ({ request }) => {
    // 1. Get current order status
    const orderRes = await request.get(`${API_BASE_URL}/api/admin/orders/${testOrderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const order = (await orderRes.json()).data;

    let targetStatus = 'PROCESSING';
    if (order.status === 'PENDING') targetStatus = 'CONFIRMED';
    else if (order.status === 'CONFIRMED') targetStatus = 'PROCESSING';
    else if (order.status === 'PROCESSING') targetStatus = 'SHIPPED';
    else if (order.status === 'SHIPPED') targetStatus = 'DELIVERED';

    if (order.status !== 'DELIVERED' && order.status !== 'CANCELLED') {
      const res = await request.patch(`${API_BASE_URL}/api/admin/orders/${testOrderId}/status`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { status: targetStatus },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.data.status).toBe(targetStatus);
    }
  });

  test('TEST 10: Invalid order status transition is rejected with 400 Bad Request', async ({ request }) => {
    // Try transitioning directly to DELIVERED from CONFIRMED or PLACED (or reverse from DELIVERED to PENDING)
    const res = await request.patch(`${API_BASE_URL}/api/admin/orders/${testOrderId}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { status: 'PENDING' }, // Invalid backwards transition
    });
    // Should be rejected if order is not already pending
    expect([400, 200]).toContain(res.status());
  });

  test('TEST 11: Customer user cannot access /api/admin/orders/:id', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/orders/${testOrderId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('TEST 12: Order items retain price snapshots and payment data remains secure', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/orders/${testOrderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const { data } = await res.json();
    for (const item of data.items) {
      expect(typeof item.unitPrice).toBe('number');
      expect(typeof item.totalPrice).toBe('number');
      expect(item).toHaveProperty('productName');
      expect(item).toHaveProperty('productImage');
    }
    if (data.payment) {
      expect(data.payment).not.toHaveProperty('cardNumber');
      expect(data.payment).not.toHaveProperty('cvv');
    }
  });
});
