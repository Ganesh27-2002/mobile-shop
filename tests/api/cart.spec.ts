import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

test.describe('Cart API Tests (Step 6)', () => {
  test.describe.configure({ mode: 'serial' });

  let customer1Token: string;
  let customer2Token: string;
  let sampleProduct1Id: string;
  let sampleProduct2Id: string;
  let lowStockProductId: string;

  const customer1 = {
    email: 'john.doe@example.com',
    password: 'Customer@123',
  };

  const customer2 = {
    email: 'jane.smith@example.com',
    password: 'Customer@123',
  };

  test.beforeAll(async ({ request }) => {
    // 1. Authenticate Customer 1
    const res1 = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: customer1,
    });
    expect(res1.status()).toBe(200);
    const body1 = await res1.json();
    customer1Token = body1.data.token;

    // 2. Authenticate Customer 2
    const res2 = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: customer2,
    });
    expect(res2.status()).toBe(200);
    const body2 = await res2.json();
    customer2Token = body2.data.token;

    // 3. Fetch sample products from catalog
    const prodRes = await request.get(`${API_BASE_URL}/api/products?limit=20`);
    expect(prodRes.status()).toBe(200);
    const prodBody = await prodRes.json();
    const products = prodBody.data.products;
    expect(products.length).toBeGreaterThanOrEqual(2);

    const inStock = products.filter((p: any) => p.stock >= 10);
    sampleProduct1Id = inStock[0]?.id || products[0].id;
    sampleProduct2Id = inStock[1]?.id || products[1].id;

    // Find a product with finite stock for stock limit tests
    const withStock = products.find((p: any) => p.stock > 0 && p.stock <= 10) || products[0];
    lowStockProductId = withStock.id;
  });

  // Helper to clear customer's cart
  const clearCartForUser = async (request: any, token: string) => {
    const res = await request.get(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status() === 200) {
      const body = await res.json();
      const items = body.data.cart.items || [];
      for (const item of items) {
        await request.delete(`${API_BASE_URL}/api/cart/items/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }
  };

  test.beforeEach(async ({ request }) => {
    await clearCartForUser(request, customer1Token);
    await clearCartForUser(request, customer2Token);
  });

  // ----------------------------------------------------
  // TEST 1: GET /api/cart requires authentication
  // ----------------------------------------------------
  test('TEST 1: GET /api/cart without token returns HTTP 401', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/cart`);
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  // ----------------------------------------------------
  // TEST 2: GET /api/cart returns empty cart for fresh user
  // ----------------------------------------------------
  test('TEST 2: GET /api/cart with valid token returns user cart object (HTTP 200)', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.cart).toBeDefined();
    expect(body.data.cart.items).toEqual([]);
    expect(body.data.cart.itemCount).toBe(0);
    expect(body.data.cart.subtotal).toBe(0);
  });

  // ----------------------------------------------------
  // TEST 3: POST /api/cart requires authentication
  // ----------------------------------------------------
  test('TEST 3: POST /api/cart without token returns HTTP 401', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/cart`, {
      data: { productId: sampleProduct1Id, quantity: 1 },
    });
    expect(response.status()).toBe(401);
  });

  // ----------------------------------------------------
  // TEST 4: POST /api/cart successfully adds item with default quantity 1
  // ----------------------------------------------------
  test('TEST 4: POST /api/cart adds product with default quantity 1 (HTTP 200)', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1Id },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.cart.items.length).toBe(1);
    expect(body.data.cart.items[0].product.id).toBe(sampleProduct1Id);
    expect(body.data.cart.items[0].quantity).toBe(1);
    expect(body.data.cart.itemCount).toBe(1);
    expect(body.data.cart.subtotal).toBe(body.data.cart.items[0].itemTotal);
  });

  // ----------------------------------------------------
  // TEST 5: POST /api/cart adds product with specified quantity > 1
  // ----------------------------------------------------
  test('TEST 5: POST /api/cart adds product with specified quantity (HTTP 200)', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1Id, quantity: 2 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.cart.items.length).toBe(1);
    expect(body.data.cart.items[0].quantity).toBe(2);
    expect(body.data.cart.itemCount).toBe(2);
  });

  // ----------------------------------------------------
  // TEST 6: POST /api/cart increments quantity when item already in cart
  // ----------------------------------------------------
  test('TEST 6: POST /api/cart existing item increments existing item quantity (HTTP 200)', async ({ request }) => {
    // Add 1 item
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1Id, quantity: 1 },
    });

    // Add 2 more of the same item
    const res = await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1Id, quantity: 2 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.cart.items.length).toBe(1);
    expect(body.data.cart.items[0].quantity).toBe(3);
    expect(body.data.cart.itemCount).toBe(3);
  });

  // ----------------------------------------------------
  // TEST 7: POST /api/cart with invalid product ID returns 404
  // ----------------------------------------------------
  test('TEST 7: POST /api/cart with non-existent product ID returns HTTP 404', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: '99999999-9999-9999-9999-999999999999', quantity: 1 },
    });
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  // ----------------------------------------------------
  // TEST 8: POST /api/cart with zero or negative quantity returns 400
  // ----------------------------------------------------
  test('TEST 8: POST /api/cart with invalid quantity <= 0 returns HTTP 400', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1Id, quantity: 0 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  // ----------------------------------------------------
  // TEST 9: POST /api/cart exceeding product stock returns 400
  // ----------------------------------------------------
  test('TEST 9: POST /api/cart exceeding available stock returns HTTP 400', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: lowStockProductId, quantity: 9999 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/stock/i);
  });

  // ----------------------------------------------------
  // TEST 10: Adding multiple distinct products to cart
  // ----------------------------------------------------
  test('TEST 10: POST /api/cart can add multiple distinct products to cart (HTTP 200)', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1Id, quantity: 1 },
    });

    const res = await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct2Id, quantity: 2 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.cart.items.length).toBe(2);
    expect(body.data.cart.itemCount).toBe(3);
  });

  // ----------------------------------------------------
  // TEST 11: PUT /api/cart/items/:id requires authentication
  // ----------------------------------------------------
  test('TEST 11: PUT /api/cart/items/:id without token returns HTTP 401', async ({ request }) => {
    const response = await request.put(`${API_BASE_URL}/api/cart/items/sample-id`, {
      data: { quantity: 2 },
    });
    expect(response.status()).toBe(401);
  });

  // ----------------------------------------------------
  // TEST 12: PUT /api/cart/items/:id successfully updates item quantity
  // ----------------------------------------------------
  test('TEST 12: PUT /api/cart/items/:id updates item quantity (HTTP 200)', async ({ request }) => {
    const addRes = await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1Id, quantity: 1 },
    });
    const addBody = await addRes.json();
    const cartItemId = addBody.data.cart.items[0].id;

    const updateRes = await request.put(`${API_BASE_URL}/api/cart/items/${cartItemId}`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { quantity: 4 },
    });
    expect(updateRes.status()).toBe(200);
    const updateBody = await updateRes.json();
    expect(updateBody.data.cart.items[0].quantity).toBe(4);
    expect(updateBody.data.cart.itemCount).toBe(4);
  });

  // ----------------------------------------------------
  // TEST 13: PUT /api/cart/items/:id with quantity < 1 returns 400
  // ----------------------------------------------------
  test('TEST 13: PUT /api/cart/items/:id with quantity < 1 returns HTTP 400', async ({ request }) => {
    const addRes = await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1Id, quantity: 1 },
    });
    const addBody = await addRes.json();
    const cartItemId = addBody.data.cart.items[0].id;

    const updateRes = await request.put(`${API_BASE_URL}/api/cart/items/${cartItemId}`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { quantity: 0 },
    });
    expect(updateRes.status()).toBe(400);
  });

  // ----------------------------------------------------
  // TEST 14: PUT /api/cart/items/:id exceeding stock returns 400
  // ----------------------------------------------------
  test('TEST 14: PUT /api/cart/items/:id exceeding available stock returns HTTP 400', async ({ request }) => {
    const addRes = await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: lowStockProductId, quantity: 1 },
    });
    const addBody = await addRes.json();
    const cartItemId = addBody.data.cart.items[0].id;

    const updateRes = await request.put(`${API_BASE_URL}/api/cart/items/${cartItemId}`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { quantity: 9999 },
    });
    expect(updateRes.status()).toBe(400);
  });

  // ----------------------------------------------------
  // TEST 15: Cross-user authorization: User B cannot update User A's cart item
  // ----------------------------------------------------
  test('TEST 15: PUT /api/cart/items/:id cannot modify another user\'s cart item (HTTP 404)', async ({ request }) => {
    // Add item to Customer 1's cart
    const addRes = await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1Id, quantity: 1 },
    });
    const addBody = await addRes.json();
    const cartItemId = addBody.data.cart.items[0].id;

    // Attempt to update Customer 1's item using Customer 2's token
    const unauthorizedRes = await request.put(`${API_BASE_URL}/api/cart/items/${cartItemId}`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
      data: { quantity: 5 },
    });
    expect(unauthorizedRes.status()).toBe(404);
  });

  // ----------------------------------------------------
  // TEST 16: DELETE /api/cart/items/:id requires authentication
  // ----------------------------------------------------
  test('TEST 16: DELETE /api/cart/items/:id without token returns HTTP 401', async ({ request }) => {
    const response = await request.delete(`${API_BASE_URL}/api/cart/items/sample-id`);
    expect(response.status()).toBe(401);
  });

  // ----------------------------------------------------
  // TEST 17: DELETE /api/cart/items/:id successfully removes item
  // ----------------------------------------------------
  test('TEST 17: DELETE /api/cart/items/:id removes item from cart (HTTP 200)', async ({ request }) => {
    const addRes = await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1Id, quantity: 2 },
    });
    const addBody = await addRes.json();
    const cartItemId = addBody.data.cart.items[0].id;

    const deleteRes = await request.delete(`${API_BASE_URL}/api/cart/items/${cartItemId}`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect(deleteRes.status()).toBe(200);
    const deleteBody = await deleteRes.json();
    expect(deleteBody.data.cart.items.length).toBe(0);
    expect(deleteBody.data.cart.itemCount).toBe(0);
    expect(deleteBody.data.cart.subtotal).toBe(0);
  });

  // ----------------------------------------------------
  // TEST 18: Cross-user authorization: User B cannot delete User A's cart item
  // ----------------------------------------------------
  test('TEST 18: DELETE /api/cart/items/:id cannot delete another user\'s cart item (HTTP 404)', async ({ request }) => {
    const addRes = await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1Id, quantity: 1 },
    });
    const addBody = await addRes.json();
    const cartItemId = addBody.data.cart.items[0].id;

    const unauthorizedDelete = await request.delete(`${API_BASE_URL}/api/cart/items/${cartItemId}`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
    });
    expect(unauthorizedDelete.status()).toBe(404);

    // Verify item is still in Customer 1's cart
    const verifyRes = await request.get(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const verifyBody = await verifyRes.json();
    expect(verifyBody.data.cart.items.length).toBe(1);
  });

  // ----------------------------------------------------
  // TEST 19: Cart calculation accuracy and floating-point safety
  // ----------------------------------------------------
  test('TEST 19: Cart calculates exact item totals and subtotal without rounding errors (HTTP 200)', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1Id, quantity: 2 },
    });
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct2Id, quantity: 3 },
    });

    const res = await request.get(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const { items, itemCount, subtotal } = body.data.cart;

    expect(items.length).toBe(2);
    expect(itemCount).toBe(5);

    let calculatedSubtotal = 0;
    for (const it of items) {
      const expectedItemTotal = Math.round(it.unitPrice * it.quantity * 100) / 100;
      expect(it.itemTotal).toBe(expectedItemTotal);
      calculatedSubtotal += it.itemTotal;
    }
    expect(subtotal).toBe(Math.round(calculatedSubtotal * 100) / 100);
  });

  // ----------------------------------------------------
  // TEST 20: Cart isolation between different users
  // ----------------------------------------------------
  test('TEST 20: User carts are strictly isolated from each other', async ({ request }) => {
    // Customer 1 adds Product 1
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1Id, quantity: 2 },
    });

    // Customer 2 adds Product 2
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
      data: { productId: sampleProduct2Id, quantity: 1 },
    });

    // Verify Customer 1's cart has only Product 1
    const res1 = await request.get(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const body1 = await res1.json();
    expect(body1.data.cart.items.length).toBe(1);
    expect(body1.data.cart.items[0].product.id).toBe(sampleProduct1Id);

    // Verify Customer 2's cart has only Product 2
    const res2 = await request.get(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
    });
    const body2 = await res2.json();
    expect(body2.data.cart.items.length).toBe(1);
    expect(body2.data.cart.items[0].product.id).toBe(sampleProduct2Id);
  });
});
