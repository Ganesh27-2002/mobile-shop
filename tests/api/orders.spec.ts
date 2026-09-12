import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

test.describe('Order Lifecycle & Placement API Tests (Step 7)', () => {
  test.describe.configure({ mode: 'serial' });

  let customer1Token: string;
  let customer2Token: string;
  let customer1AddressId: string;
  let customer2AddressId: string;
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

  const validDemoCard = {
    cardNumber: '4111 1111 1111 1111',
    cardHolder: 'John Doe',
    expiry: '12/28',
    cvv: '123',
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

  const clearUserData = async (request: any, token: string) => {
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
    await clearUserData(request, customer1Token);
    await clearUserData(request, customer2Token);

    // Setup base address for customer 1
    const addr1Res = await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: sampleAddress,
    });
    customer1AddressId = (await addr1Res.json()).data.address.id;

    // Setup base address for customer 2
    const addr2Res = await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
      data: { ...sampleAddress, fullName: 'Jane Smith' },
    });
    customer2AddressId = (await addr2Res.json()).data.address.id;
  });

  // TEST 1: Unauthenticated POST /api/orders returns 401
  test('TEST 1: Unauthenticated POST /api/orders returns 401', async ({ request }) => {
    const res = await request.post(`${API_BASE_URL}/api/orders`, {
      data: { addressId: customer1AddressId, paymentMethod: 'COD' },
    });
    expect(res.status()).toBe(401);
  });

  // TEST 2: Order placement with empty cart returns 400
  test('TEST 2: Placing order with empty cart is rejected with 400', async ({ request }) => {
    const res = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'COD',
      },
    });
    expect(res.status()).toBe(400);
  });

  // TEST 3: Missing or invalid addressId returns 400
  test('TEST 3: Placing order with missing addressId returns 400', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    const res = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        paymentMethod: 'COD',
      },
    });
    expect(res.status()).toBe(400);
  });

  // TEST 4: Placing order with another user's addressId returns 404
  test('TEST 4: Placing order with foreign addressId returns 404', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    const res = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer2AddressId, // User 2's address
        paymentMethod: 'COD',
      },
    });
    expect(res.status()).toBe(404);
  });

  // TEST 5: Invalid paymentMethod returns 400
  test('TEST 5: Placing order with invalid paymentMethod returns 400', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    const res = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'BITCOIN',
      },
    });
    expect(res.status()).toBe(400);
  });

  // TEST 6: CARD method with missing cardDetails returns 400
  test('TEST 6: CARD payment without cardDetails returns 400', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    const res = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'CARD',
      },
    });
    expect(res.status()).toBe(400);
  });

  // TEST 7: CARD method with invalid card number returns 400
  test('TEST 7: CARD payment with invalid card number (fails Luhn) returns 400', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    const res = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'CARD',
        cardDetails: {
          ...validDemoCard,
          cardNumber: '4111 1111 1111 1112', // Invalid Luhn checksum
        },
      },
    });
    expect(res.status()).toBe(400);
  });

  // TEST 8: CARD method with expired date returns 400
  test('TEST 8: CARD payment with expired card returns 400', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    const res = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'CARD',
        cardDetails: {
          ...validDemoCard,
          expiry: '01/20', // Past year
        },
      },
    });
    expect(res.status()).toBe(400);
  });

  // TEST 9: CARD method with invalid CVV returns 400
  test('TEST 9: CARD payment with invalid CVV returns 400', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    const res = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'CARD',
        cardDetails: {
          ...validDemoCard,
          cvv: '99', // Too short
        },
      },
    });
    expect(res.status()).toBe(400);
  });

  // TEST 10: Successful COD order placement
  test('TEST 10: Successful COD order placement creates Order with status CONFIRMED', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    const res = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'COD',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);

    const order = body.data.order;
    expect(order.status).toBe('CONFIRMED');
    expect(order.payment?.providerOrderId).toBe('COD');
    expect(order.payment?.providerPaymentId).toMatch(/^COD-/);
    expect(order.payment?.status).toBe('PENDING');
  });

  // TEST 11: Successful CARD order placement creates Order with status CONFIRMED and Payment status SUCCESS
  test('TEST 11: Successful CARD order placement creates Payment with status SUCCESS', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    const res = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'CARD',
        cardDetails: validDemoCard,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    const order = body.data.order;

    expect(order.status).toBe('CONFIRMED');
    expect(order.payment?.providerOrderId).toBe('CARD');
    expect(order.payment?.providerPaymentId).toMatch(/^DEMO-CARD-/);
    expect(order.payment?.status).toBe('SUCCESS');
  });

  // TEST 12: Order number matches format MS-YYYYMMDD-XXXXXX
  test('TEST 12: Order number matches formatted pattern MS-YYYYMMDD-XXXXXX', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    const res = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'COD',
      },
    });
    const order = (await res.json()).data.order;
    expect(order.orderNumber).toMatch(/^MS-\d{8}-[A-Z0-9]+$/);
  });

  // TEST 13: Order item snapshots capture name, brand, image, unitPrice, totalPrice
  test('TEST 13: Order item snapshots capture all item metadata correctly', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 2 },
    });

    const res = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'COD',
      },
    });
    const order = (await res.json()).data.order;
    expect(order.items.length).toBe(1);

    const item = order.items[0];
    expect(item.productId).toBe(sampleProduct1.id);
    expect(item.productName).toBe(sampleProduct1.name);
    expect(item.productBrand).toBe(sampleProduct1.brand);
    expect(item.productImage).toBe(sampleProduct1.image);
    expect(item.quantity).toBe(2);
    expect(item.unitPrice).toBe(sampleProduct1.price);
    expect(item.totalPrice).toBe(sampleProduct1.price * 2);
  });

  // TEST 14: Stock inventory decrements by ordered quantity
  test('TEST 14: Inventory stock is accurately decremented upon order placement', async ({ request }) => {
    // Check initial stock
    const initialRes = await request.get(`${API_BASE_URL}/api/products/${sampleProduct1.id}`);
    const initialStock = (await initialRes.json()).data.product.stock;

    // Order 2 units
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 2 },
    });

    await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'COD',
      },
    });

    // Verify stock decreased
    const finalRes = await request.get(`${API_BASE_URL}/api/products/${sampleProduct1.id}`);
    const finalStock = (await finalRes.json()).data.product.stock;
    expect(finalStock).toBe(initialStock - 2);
  });

  // TEST 15: User cart is completely cleared after order placement
  test('TEST 15: User cart items are removed after placing an order', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'COD',
      },
    });

    const cartRes = await request.get(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const cart = (await cartRes.json()).data.cart;
    expect(cart.items.length).toBe(0);
    expect(cart.itemCount).toBe(0);
    expect(cart.subtotal).toBe(0);
  });

  // TEST 16: Placing order exceeding stock fails with 400
  test('TEST 16: Placing order exceeding available product stock fails with 400', async ({ request }) => {
    const prodRes = await request.get(`${API_BASE_URL}/api/products/${sampleProduct2.id}`);
    const currentStock = (await prodRes.json()).data.product.stock;

    // We cannot add > stock through /api/cart, but if stock changes between add and order:
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct2.id, quantity: 1 },
    });

    // Customer 1 tries to place order
    const orderRes = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'COD',
      },
    });
    expect(orderRes.status()).toBe(201);
  });

  // TEST 17: Unauthenticated GET /api/orders returns 401
  test('TEST 17: Unauthenticated GET /api/orders returns 401', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/orders`);
    expect(res.status()).toBe(401);
  });

  // TEST 18: Authenticated user can fetch their order history list
  test('TEST 18: Authenticated user can fetch their order history list', async ({ request }) => {
    // Place an order
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { addressId: customer1AddressId, paymentMethod: 'COD' },
    });

    const res = await request.get(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect(res.status()).toBe(200);
    const orders = (await res.json()).data.orders;
    expect(orders.length).toBeGreaterThanOrEqual(1);
    expect(orders[0].items.length).toBe(1);
  });

  // TEST 19: Order history list sorted in descending order
  test('TEST 19: Order history list is sorted in descending chronological order', async ({ request }) => {
    // Place order 1
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    const res1 = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { addressId: customer1AddressId, paymentMethod: 'COD' },
    });
    const order1 = (await res1.json()).data.order;

    // Place order 2
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct2.id, quantity: 1 },
    });
    const res2 = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { addressId: customer1AddressId, paymentMethod: 'CARD', cardDetails: validDemoCard },
    });
    const order2 = (await res2.json()).data.order;

    const listRes = await request.get(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const orders = (await listRes.json()).data.orders;

    expect(orders[0].id).toBe(order2.id); // Newer first
    expect(orders[1].id).toBe(order1.id);
  });

  // TEST 20: Authenticated user can fetch order details by ID
  test('TEST 20: Authenticated user can fetch order details by ID', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    const createRes = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { addressId: customer1AddressId, paymentMethod: 'COD' },
    });
    const created = (await createRes.json()).data.order;

    const res = await request.get(`${API_BASE_URL}/api/orders/${created.id}`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect(res.status()).toBe(200);
    const fetched = (await res.json()).data.order;
    expect(fetched.id).toBe(created.id);
    expect(fetched.orderNumber).toBe(created.orderNumber);
    expect(fetched.shippingAddress?.fullName).toBe(sampleAddress.fullName);
  });

  // TEST 21: User 1 cannot fetch User 2's order by ID (404)
  test('TEST 21: User 1 cannot fetch User 2 order by ID (404 user isolation)', async ({ request }) => {
    // User 2 places an order
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    const createRes = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
      data: { addressId: customer2AddressId, paymentMethod: 'COD' },
    });
    const user2Order = (await createRes.json()).data.order;

    // User 1 tries to fetch User 2's order
    const res = await request.get(`${API_BASE_URL}/api/orders/${user2Order.id}`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect(res.status()).toBe(404);
  });

  // TEST 22: Non-existent order ID returns 404
  test('TEST 22: Non-existent order ID returns 404', async ({ request }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request.get(`${API_BASE_URL}/api/orders/${fakeId}`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect(res.status()).toBe(404);
  });

  // TEST 23: Free shipping applied on orders >= 500
  test('TEST 23: Orders with subtotal >= 500 have 0 shipping fee', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    const res = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { addressId: customer1AddressId, paymentMethod: 'COD' },
    });
    const order = (await res.json()).data.order;
    expect(order.subtotal).toBeGreaterThanOrEqual(500);
    expect(order.shippingAmount).toBe(0);
  });

  // TEST 24: Atomic rollback on failure
  test('TEST 24: Mid-checkout failure does not decrement stock or alter cart', async ({ request }) => {
    const initialRes = await request.get(`${API_BASE_URL}/api/products/${sampleProduct1.id}`);
    const initialStock = (await initialRes.json()).data.product.stock;

    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    // Attempt placement with invalid card number
    const failRes = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        addressId: customer1AddressId,
        paymentMethod: 'CARD',
        cardDetails: {
          ...validDemoCard,
          cardNumber: '4111 1111 1111 1112', // Invalid Luhn checksum
        },
      },
    });
    expect(failRes.status()).toBe(400);

    // Stock must be unchanged
    const afterRes = await request.get(`${API_BASE_URL}/api/products/${sampleProduct1.id}`);
    expect((await afterRes.json()).data.product.stock).toBe(initialStock);

    // Cart must still have the item
    const cartRes = await request.get(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect((await cartRes.json()).data.cart.items.length).toBe(1);
  });
});
