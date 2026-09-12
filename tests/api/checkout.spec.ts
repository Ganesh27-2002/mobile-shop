import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

test.describe('Checkout API Tests (Step 7)', () => {
  test.describe.configure({ mode: 'serial' });

  let customer1Token: string;
  let customer2Token: string;
  let sampleProduct1: any;
  let sampleProduct2: any;

  const customer1 = {
    email: 'john.doe@example.com',
    password: 'Customer@123',
  };

  const customer2 = {
    email: 'jane.smith@example.com',
    password: 'Customer@123',
  };

  const sampleAddress = {
    fullName: 'John Doe',
    phone: '9876543210',
    addressLine1: '402 Sunset Boulevard',
    addressLine2: 'Near Central Park',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
  };

  test.beforeAll(async ({ request }) => {
    const res1 = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    expect(res1.status()).toBe(200);
    customer1Token = (await res1.json()).data.token;

    const res2 = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer2 });
    expect(res2.status()).toBe(200);
    customer2Token = (await res2.json()).data.token;

    // Fetch sample products
    const prodRes = await request.get(`${API_BASE_URL}/api/products?limit=5`);
    const prods = (await prodRes.json()).data.products;
    sampleProduct1 = prods[0];
    sampleProduct2 = prods[1];
  });

  const clearUserCartAndAddresses = async (request: any, token: string) => {
    // Clear cart
    const cartRes = await request.get(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (cartRes.status() === 200) {
      const items = (await cartRes.json()).data.cart.items || [];
      for (const it of items) {
        await request.delete(`${API_BASE_URL}/api/cart/items/${it.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }

    // Clear addresses
    const addrRes = await request.get(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (addrRes.status() === 200) {
      const addrs = (await addrRes.json()).data.addresses || [];
      for (const a of addrs) {
        await request.delete(`${API_BASE_URL}/api/addresses/${a.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }
  };

  test.beforeEach(async ({ request }) => {
    await clearUserCartAndAddresses(request, customer1Token);
    await clearUserCartAndAddresses(request, customer2Token);
  });

  // TEST 1: Unauthenticated GET /api/checkout/summary returns 401
  test('TEST 1: Unauthenticated GET /api/checkout/summary returns 401', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/checkout/summary`);
    expect(res.status()).toBe(401);
  });

  // TEST 2: Empty cart summary returns canCheckout: false and zero totals
  test('TEST 2: Empty cart checkout summary returns canCheckout: false and zero totals', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/checkout/summary`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.canCheckout).toBe(false);
    expect(body.data.cart.items).toEqual([]);
    expect(body.data.pricing.subtotal).toBe(0);
    expect(body.data.pricing.totalAmount).toBe(50); // Shipping is 50 when subtotal < 500
  });

  // TEST 3: Cart with items returns calculated subtotal and pricing summary
  test('TEST 3: Cart with items returns accurately calculated subtotal and pricing', async ({ request }) => {
    // Add product to cart
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 2 },
    });

    const res = await request.get(`${API_BASE_URL}/api/checkout/summary`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const data = body.data;

    const expectedSubtotal = sampleProduct1.price * 2;
    expect(data.cart.items.length).toBe(1);
    expect(data.pricing.subtotal).toBe(expectedSubtotal);
  });

  // TEST 4: Subtotal >= 500 has free shipping
  test('TEST 4: Subtotal >= 500 grants free shipping (shippingAmount: 0, isFreeShipping: true)', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    const res = await request.get(`${API_BASE_URL}/api/checkout/summary`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const data = (await res.json()).data;
    expect(data.pricing.subtotal).toBeGreaterThanOrEqual(500);
    expect(data.pricing.shippingAmount).toBe(0);
    expect(data.pricing.isFreeShipping).toBe(true);
  });

  // TEST 5: GST is computed as 18% of subtotal
  test('TEST 5: Tax is accurately calculated as 18% of subtotal', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    const res = await request.get(`${API_BASE_URL}/api/checkout/summary`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const pricing = (await res.json()).data.pricing;
    const expectedTax = Math.round(pricing.subtotal * 0.18 * 100) / 100;
    expect(pricing.taxAmount).toBe(expectedTax);
  });

  // TEST 6: Total amount equals subtotal + shipping + tax
  test('TEST 6: Total amount strictly matches subtotal + shipping + tax', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    const res = await request.get(`${API_BASE_URL}/api/checkout/summary`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const pricing = (await res.json()).data.pricing;
    const expectedTotal = Math.round((pricing.subtotal + pricing.shippingAmount + pricing.taxAmount) * 100) / 100;
    expect(pricing.totalAmount).toBe(expectedTotal);
  });

  // TEST 7: Cart with items but no address returns canCheckout: false
  test('TEST 7: User with items but no saved address receives canCheckout: false', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    const res = await request.get(`${API_BASE_URL}/api/checkout/summary`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const data = (await res.json()).data;
    expect(data.addresses.length).toBe(0);
    expect(data.defaultAddress).toBeNull();
    expect(data.canCheckout).toBe(false);
  });

  // TEST 8: Checkout summary returns address list and default address
  test('TEST 8: User with saved addresses receives address list and canCheckout: true', async ({ request }) => {
    // Add cart item
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    // Save address
    const addrRes = await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: sampleAddress,
    });
    const addr = (await addrRes.json()).data.address;

    const res = await request.get(`${API_BASE_URL}/api/checkout/summary`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const data = (await res.json()).data;
    expect(data.addresses.length).toBe(1);
    expect(data.defaultAddress?.id).toBe(addr.id);
    expect(data.canCheckout).toBe(true);
  });

  // TEST 9: Multi-item cart calculates combined pricing
  test('TEST 9: Multiple items in cart produce combined subtotal and item breakdown', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct2.id, quantity: 2 },
    });

    const res = await request.get(`${API_BASE_URL}/api/checkout/summary`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const data = (await res.json()).data;
    expect(data.cart.items.length).toBe(2);
    const expectedSubtotal = Math.round((sampleProduct1.price + sampleProduct2.price * 2) * 100) / 100;
    expect(data.pricing.subtotal).toBe(expectedSubtotal);
  });

  // TEST 10: Strict data isolation
  test('TEST 10: User 1 and User 2 receive isolated checkout summaries', async ({ request }) => {
    // User 1 adds product 1
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    // User 2 adds product 2
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
      data: { productId: sampleProduct2.id, quantity: 3 },
    });

    const res1 = await request.get(`${API_BASE_URL}/api/checkout/summary`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const res2 = await request.get(`${API_BASE_URL}/api/checkout/summary`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
    });

    const data1 = (await res1.json()).data;
    const data2 = (await res2.json()).data;

    expect(data1.cart.items.length).toBe(1);
    expect(data1.cart.items[0].product.id).toBe(sampleProduct1.id);

    expect(data2.cart.items.length).toBe(1);
    expect(data2.cart.items[0].product.id).toBe(sampleProduct2.id);
  });
});
