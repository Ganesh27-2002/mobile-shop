import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

test.describe('Admin Inventory & Customer Cart Cross-Validation Integration Test (Part 37)', () => {
  let adminToken: string;
  let customerToken: string;
  let testProductId: string;
  let customerAddressId: string;

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

    // Get an address for the customer
    const addrRes = await request.get(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const addrData = (await addrRes.json()).data;
    const addrs = addrData.addresses || addrData;
    if (Array.isArray(addrs) && addrs.length > 0) {
      customerAddressId = addrs[0].id;
    } else {
      const newAddr = await request.post(`${API_BASE_URL}/api/addresses`, {
        headers: { Authorization: `Bearer ${customerToken}` },
        data: {
          fullName: 'Integration Tester',
          phone: '9876543210',
          addressLine1: '404 Tech Park',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      });
      const newAddrJson = await newAddr.json();
      customerAddressId = newAddrJson.data.address ? newAddrJson.data.address.id : newAddrJson.data.id;
    }

    // Get a product
    const prodRes = await request.get(`${API_BASE_URL}/api/products?limit=1`);
    testProductId = (await prodRes.json()).data.products[0].id;
  });

  test('TEST 1: Step-by-step cross-validation: Stock change vs live customer checkout validation', async ({ request }) => {
    // 1. Admin sets product stock = 10
    const setStockRes = await request.patch(`${API_BASE_URL}/api/admin/products/${testProductId}/stock`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { stock: 10 },
    });
    expect(setStockRes.status()).toBe(200);
    expect((await setStockRes.json()).data.newStock).toBe(10);

    // Clear customer cart
    const cartRes = await request.get(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const currentCart = (await cartRes.json()).data.cart;
    for (const item of currentCart?.items || []) {
      await request.delete(`${API_BASE_URL}/api/cart/items/${item.id}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
    }

    // 2. Customer adds quantity = 4 of the product to cart
    const addRes = await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: { productId: testProductId, quantity: 4 },
    });
    expect(addRes.status()).toBe(200);
    const addedCart = (await addRes.json()).data.cart;
    expect(addedCart.itemCount).toBe(4);

    // 3. Admin lowers product stock to 2 in the background
    const lowerStockRes = await request.patch(`${API_BASE_URL}/api/admin/products/${testProductId}/stock`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { stock: 2 },
    });
    expect(lowerStockRes.status()).toBe(200);
    expect((await lowerStockRes.json()).data.newStock).toBe(2);

    // 4. Customer attempts to place the order with 4 units
    const orderFailRes = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        addressId: customerAddressId,
        paymentMethod: 'COD',
      },
    });

    // 5. Checkout detects insufficient stock and returns 400 Bad Request
    expect(orderFailRes.status()).toBe(400);
    const failBody = await orderFailRes.json();
    expect(failBody.success).toBe(false);
    expect(failBody.message).toContain('Insufficient stock');

    // Cart items must remain intact
    const verifyCartRes = await request.get(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect((await verifyCartRes.json()).data.cart.itemCount).toBe(4);

    // 6. Admin replenishes stock to 10
    const replenishRes = await request.patch(`${API_BASE_URL}/api/admin/products/${testProductId}/stock`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { stock: 10 },
    });
    expect(replenishRes.status()).toBe(200);

    // 7. Customer retries order placement -> Succeeds!
    const orderSuccessRes = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        addressId: customerAddressId,
        paymentMethod: 'COD',
      },
    });
    expect(orderSuccessRes.status()).toBe(201);
    const successBody = await orderSuccessRes.json();
    expect(successBody.success).toBe(true);
    expect(successBody.data.order.items[0].quantity).toBe(4);

    // 8. Product stock must now be 6 (10 - 4)
    const checkStockRes = await request.get(`${API_BASE_URL}/api/admin/products/${testProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const updatedProd = (await checkStockRes.json()).data;
    expect(updatedProd.stock).toBe(6);
  });
});
