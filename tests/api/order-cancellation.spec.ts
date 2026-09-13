import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

test.describe('Order Safe Cancellation & Inventory Restoration API Tests (Step 9)', () => {
  test.describe.configure({ mode: 'serial' });

  let customer1Token: string;
  let customer2Token: string;
  let adminToken: string;
  let customer1AddressId: string;
  let sampleProduct: any;

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

    // 4. Sample product
    const prodRes = await request.get(`${API_BASE_URL}/api/products?limit=1`);
    sampleProduct = (await prodRes.json()).data.products[0];

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
          fullName: 'John Doe Cancel Test',
          phone: '9876543210',
          addressLine1: '456 Safe St',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      });
      customer1AddressId = (await createAddrRes.json()).data.address.id;
    }
  });

  async function clearCart(req: any, token: string) {
    const cartRes = await req.get(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (cartRes.ok()) {
      const items = (await cartRes.json()).data?.cart?.items || [];
      for (const item of items) {
        await req.delete(`${API_BASE_URL}/api/cart/items/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }
  }

  // TEST 1: Unauthenticated cancellation returns 401
  test('TEST 1: Unauthenticated request to /api/orders/:id/cancel returns 401 Unauthorized', async ({ request }) => {
    const res = await request.post(`${API_BASE_URL}/api/orders/some-dummy-id/cancel`, {
      data: { reason: 'Test cancel' },
    });
    expect(res.status()).toBe(401);
  });

  // TEST 2: Customer can cancel own order and inventory is accurately restored
  test('TEST 2: Customer cancels own order -> inventory is restored & status becomes CANCELLED', async ({ request }) => {
    await clearCart(request, customer1Token);

    // 1. Check current stock
    const p1Res = await request.get(`${API_BASE_URL}/api/products/${sampleProduct.id}`);
    const initialStock = (await p1Res.json()).data.product.stock;

    // 2. Add 2 units to cart & place order
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct.id, quantity: 2 },
    });

    const orderRes = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'COD',
      },
    });
    expect(orderRes.status()).toBe(201);
    const order = (await orderRes.json()).data.order;

    // 3. Verify stock decremented by 2
    const p2Res = await request.get(`${API_BASE_URL}/api/products/${sampleProduct.id}`);
    const stockAfterOrder = (await p2Res.json()).data.product.stock;
    expect(stockAfterOrder).toBe(initialStock - 2);

    // 4. Cancel order
    const cancelRes = await request.post(`${API_BASE_URL}/api/orders/${order.id}/cancel`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { reason: 'Ordered extra units by mistake' },
    });
    expect(cancelRes.status()).toBe(200);
    const cancelBody = await cancelRes.json();
    expect(cancelBody.success).toBe(true);
    expect(cancelBody.data.order.status).toBe('CANCELLED');
    expect(cancelBody.data.order.cancelledAt).toBeTruthy();
    expect(cancelBody.data.order.cancellationReason).toBe('Ordered extra units by mistake');

    // 5. Verify stock fully restored to initialStock
    const p3Res = await request.get(`${API_BASE_URL}/api/products/${sampleProduct.id}`);
    const stockAfterCancel = (await p3Res.json()).data.product.stock;
    expect(stockAfterCancel).toBe(initialStock);

    // 6. Attempt second cancellation -> must fail
    const secondCancelRes = await request.post(`${API_BASE_URL}/api/orders/${order.id}/cancel`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { reason: 'Cancel again' },
    });
    expect(secondCancelRes.status()).toBe(400);

    // 7. Stock must remain unchanged after failed second cancellation
    const p4Res = await request.get(`${API_BASE_URL}/api/products/${sampleProduct.id}`);
    const stockAfterSecondCancel = (await p4Res.json()).data.product.stock;
    expect(stockAfterSecondCancel).toBe(initialStock);
  });

  // TEST 3: Customer cannot cancel another user's order
  test("TEST 3: Customer cannot cancel another user's order (returns 403 or 404)", async ({ request }) => {
    // Create order for Customer 1
    await clearCart(request, customer1Token);
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct.id, quantity: 1 },
    });

    const orderRes = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'COD',
      },
    });
    const order = (await orderRes.json()).data.order;

    // Customer 2 attempts to cancel Customer 1's order
    const cancelRes = await request.post(`${API_BASE_URL}/api/orders/${order.id}/cancel`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
      data: { reason: 'Unauthorized cancel attempt' },
    });
    expect([403, 404]).toContain(cancelRes.status());
  });

  // TEST 4: Processing order can be cancelled
  test('TEST 4: Order in PROCESSING status can be cancelled by customer', async ({ request }) => {
    // Place order
    await clearCart(request, customer1Token);
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct.id, quantity: 1 },
    });

    const orderRes = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'COD',
      },
    });
    const order = (await orderRes.json()).data.order;

    // Admin moves to PROCESSING
    await request.patch(`${API_BASE_URL}/api/admin/orders/${order.id}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { status: 'PROCESSING' },
    });

    // Customer cancels PROCESSING order
    const cancelRes = await request.post(`${API_BASE_URL}/api/orders/${order.id}/cancel`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { reason: 'Processing took too long' },
    });
    expect(cancelRes.status()).toBe(200);
    const body = await cancelRes.json();
    expect(body.data.order.status).toBe('CANCELLED');
  });

  // TEST 5: Shipped order cannot be cancelled
  test('TEST 5: Order in SHIPPED status cannot be cancelled', async ({ request }) => {
    // Place order
    await clearCart(request, customer1Token);
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct.id, quantity: 1 },
    });

    const orderRes = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'COD',
      },
    });
    const order = (await orderRes.json()).data.order;

    // Move to PROCESSING then SHIPPED
    await request.patch(`${API_BASE_URL}/api/admin/orders/${order.id}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { status: 'PROCESSING' },
    });
    await request.patch(`${API_BASE_URL}/api/admin/orders/${order.id}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { status: 'SHIPPED' },
    });

    // Customer attempts to cancel
    const cancelRes = await request.post(`${API_BASE_URL}/api/orders/${order.id}/cancel`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { reason: 'Too late' },
    });
    expect(cancelRes.status()).toBe(400);
  });

  // TEST 6: Concurrency test - two simultaneous cancellation requests
  test('TEST 6: Concurrent cancellations - only one succeeds, inventory restored exactly once', async ({ request }) => {
    // Check initial stock
    const p1Res = await request.get(`${API_BASE_URL}/api/products/${sampleProduct.id}`);
    const initialStock = (await p1Res.json()).data.product.stock;

    // Place order for 3 items
    await clearCart(request, customer1Token);
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct.id, quantity: 3 },
    });

    const orderRes = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'COD',
      },
    });
    const order = (await orderRes.json()).data.order;

    // Execute two simultaneous cancellation requests with Promise.all
    const [req1, req2] = await Promise.all([
      request.post(`${API_BASE_URL}/api/orders/${order.id}/cancel`, {
        headers: { Authorization: `Bearer ${customer1Token}` },
        data: { reason: 'Concurrent Cancel 1' },
      }),
      request.post(`${API_BASE_URL}/api/orders/${order.id}/cancel`, {
        headers: { Authorization: `Bearer ${customer1Token}` },
        data: { reason: 'Concurrent Cancel 2' },
      }),
    ]);

    const statuses = [req1.status(), req2.status()];
    // Exactly one should be 200, the other should be 400
    expect(statuses).toContain(200);
    expect(statuses).toContain(400);

    // Final stock must be restored exactly once (initialStock)
    const pFinalRes = await request.get(`${API_BASE_URL}/api/products/${sampleProduct.id}`);
    const finalStock = (await pFinalRes.json()).data.product.stock;
    expect(finalStock).toBe(initialStock);
  });
});
