import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

test.describe('Order Lifecycle & Tracking API Tests (Step 9)', () => {
  test.describe.configure({ mode: 'serial' });

  let customer1Token: string;
  let customer2Token: string;
  let adminToken: string;
  let customer1AddressId: string;
  let sampleProductId: string;
  let testOrderId: string;

  const adminCredentials = {
    email: 'admin@mobileshop.com',
    password: 'Admin@123',
  };

  const customer1Credentials = {
    email: 'john.doe@example.com',
    password: 'Customer@123',
  };

  const customer2Credentials = {
    email: 'jane.smith@example.com',
    password: 'Customer@123',
  };

  test.beforeAll(async ({ request }) => {
    // 1. Admin Login
    const adminRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: adminCredentials,
    });
    adminToken = (await adminRes.json()).data.token;

    // 2. Customer 1 Login
    const cust1Res = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: customer1Credentials,
    });
    customer1Token = (await cust1Res.json()).data.token;

    // 3. Customer 2 Login
    const cust2Res = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: customer2Credentials,
    });
    customer2Token = (await cust2Res.json()).data.token;

    // 4. Get a sample product
    const prodRes = await request.get(`${API_BASE_URL}/api/products?limit=1`);
    sampleProductId = (await prodRes.json()).data.products[0].id;

    // 5. Setup Customer 1 Address
    const addrRes = await request.get(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const addrs = (await addrRes.json()).data.addresses;
    if (addrs.length > 0) {
      customer1AddressId = addrs[0].id;
    } else {
      const createAddrRes = await request.post(`${API_BASE_URL}/api/addresses`, {
        headers: { Authorization: `Bearer ${customer1Token}` },
        data: {
          fullName: 'John Doe Lifecycle',
          phone: '9876543210',
          addressLine1: '123 Tech Blvd',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      });
      customer1AddressId = (await createAddrRes.json()).data.address.id;
    }

    // 6. Clear cart & add product
    await request.delete(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProductId, quantity: 1 },
    });

    // 7. Place Order
    const orderRes = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'COD',
      },
    });
    expect(orderRes.status()).toBe(201);
    testOrderId = (await orderRes.json()).data.order.id;
  });

  // TEST 1: Unauthenticated tracking request returns 401
  test('TEST 1: Unauthenticated request to /api/orders/:id/tracking returns 401 Unauthorized', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/orders/${testOrderId}/tracking`);
    expect(res.status()).toBe(401);
  });

  // TEST 2: Customer can track own order
  test('TEST 2: Customer can track own order and receive structured milestone timeline', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/orders/${testOrderId}/tracking`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('orderId', testOrderId);
    expect(body.data).toHaveProperty('orderNumber');
    expect(body.data).toHaveProperty('status');
    expect(Array.isArray(body.data.timeline)).toBe(true);
    expect(body.data.timeline.length).toBe(5);
  });

  // TEST 3: Customer cannot track another customer's order
  test("TEST 3: Customer cannot track another customer's order (returns 403 or 404)", async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/orders/${testOrderId}/tracking`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
    });
    expect([403, 404]).toContain(res.status());
  });

  // TEST 4: Initial timeline reflects PLACED milestone
  test('TEST 4: Initial tracking timeline reflects PLACED milestone with valid timestamp', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/orders/${testOrderId}/tracking`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const body = await res.json();
    const placedStep = body.data.timeline.find((s: any) => s.status === 'PLACED');
    expect(placedStep).toBeDefined();
    expect(placedStep.completed).toBe(true);
    expect(placedStep.timestamp).toBeTruthy();
  });

  // TEST 5: Admin transitions order to PROCESSING
  test('TEST 5: Admin transitions order to PROCESSING and timestamp updates', async ({ request }) => {
    const res = await request.patch(`${API_BASE_URL}/api/admin/orders/${testOrderId}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { status: 'PROCESSING' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('PROCESSING');
    expect(body.data.processingAt).toBeTruthy();

    // Verify customer tracking reflects PROCESSING completed
    const trackRes = await request.get(`${API_BASE_URL}/api/orders/${testOrderId}/tracking`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const trackBody = await trackRes.json();
    const procStep = trackBody.data.timeline.find((s: any) => s.status === 'PROCESSING');
    expect(procStep.completed).toBe(true);
    expect(procStep.timestamp).toBeTruthy();
  });

  // TEST 6: Admin transitions order to SHIPPED
  test('TEST 6: Admin transitions order to SHIPPED and timeline updates', async ({ request }) => {
    const res = await request.patch(`${API_BASE_URL}/api/admin/orders/${testOrderId}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { status: 'SHIPPED' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('SHIPPED');
    expect(body.data.shippedAt).toBeTruthy();

    const trackRes = await request.get(`${API_BASE_URL}/api/orders/${testOrderId}/tracking`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const trackBody = await trackRes.json();
    const shipStep = trackBody.data.timeline.find((s: any) => s.status === 'SHIPPED');
    expect(shipStep.completed).toBe(true);
  });

  // TEST 7: Admin transitions order to DELIVERED
  test('TEST 7: Admin transitions order to DELIVERED terminal status', async ({ request }) => {
    const res = await request.patch(`${API_BASE_URL}/api/admin/orders/${testOrderId}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { status: 'DELIVERED' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('DELIVERED');
    expect(body.data.deliveredAt).toBeTruthy();

    const trackRes = await request.get(`${API_BASE_URL}/api/orders/${testOrderId}/tracking`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const trackBody = await trackRes.json();
    const delivStep = trackBody.data.timeline.find((s: any) => s.status === 'DELIVERED');
    expect(delivStep.completed).toBe(true);
    expect(delivStep.timestamp).toBeTruthy();
  });

  // TEST 8: Invalid transition from DELIVERED is rejected
  test('TEST 8: Transitioning out of terminal DELIVERED status is rejected with 400', async ({ request }) => {
    const res = await request.patch(`${API_BASE_URL}/api/admin/orders/${testOrderId}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { status: 'PROCESSING' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toContain('Invalid order status transition');
  });

  // TEST 9: Delivered order cannot be cancelled
  test('TEST 9: Delivered order cannot be cancelled by customer', async ({ request }) => {
    const res = await request.post(`${API_BASE_URL}/api/orders/${testOrderId}/cancel`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { reason: 'No longer needed' },
    });
    expect(res.status()).toBe(400);
  });

  // TEST 10: Admin order lookup returns tracking timeline
  test('TEST 10: Admin order details endpoint includes tracking timeline object', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/admin/orders/${testOrderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveProperty('tracking');
    expect(body.data.tracking.timeline.every((s: any) => s.completed)).toBe(true);
  });
});
