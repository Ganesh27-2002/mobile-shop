import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

test.describe('Checkout, Payment Simulation & Order Workflow UI Tests (Step 7)', () => {
  test.describe.configure({ mode: 'serial' });

  const customer1 = {
    email: 'john.doe@example.com',
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

  let sampleProduct1: any;
  let sampleProduct2: any;

  // Clear data helper
  const resetUserData = async (request: any) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    if (loginRes.status() === 200) {
      const token = (await loginRes.json()).data.token;

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
        for (const addr of addrs) {
          await request.delete(`${API_BASE_URL}/api/addresses/${addr.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
    }
  };

  const loginUser = async (page: any) => {
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(customer1.email);
    await page.getByLabel(/password/i).fill(customer1.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  };

  test.beforeAll(async ({ request }) => {
    const prodRes = await request.get(`${API_BASE_URL}/api/products?limit=5`);
    const prods = (await prodRes.json()).data.products;
    sampleProduct1 = prods[0];
    sampleProduct2 = prods[1];
  });

  test.beforeEach(async ({ request, page }) => {
    await resetUserData(request);
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  // TEST 1: Unauthenticated access to /checkout redirects to /login
  test('TEST 1: Unauthenticated access to /checkout redirects to /login', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/login/);
  });

  // TEST 2: Checkout page shows empty cart state when no items in cart
  test('TEST 2: Checkout page shows empty state when cart has no items', async ({ page }) => {
    await loginUser(page);
    await page.goto('/checkout');
    await expect(page.getByTestId('checkout-page')).toBeVisible();
    await expect(page.getByTestId('empty-checkout-state')).toBeVisible();
  });

  // TEST 3: Proceed to Checkout button on CartPage navigates to /checkout
  test('TEST 3: Cart page "Proceed to Checkout" navigates to /checkout', async ({ page, request }) => {
    // Add product to cart via API
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    await loginUser(page);
    await page.goto('/cart');
    await expect(page.getByTestId('proceed-checkout-btn')).toBeVisible();
    await page.getByTestId('proceed-checkout-btn').click();
    await expect(page).toHaveURL('/checkout');
    await expect(page.getByTestId('checkout-page')).toBeVisible();
  });

  // TEST 4: Checkout page renders all 3 core sections (Delivery, Payment, Review)
  test('TEST 4: Checkout page renders Delivery, Payment, and Review sections', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: sampleAddress,
    });

    await loginUser(page);
    await page.goto('/checkout');

    await expect(page.getByTestId('section-address')).toBeVisible();
    await expect(page.getByTestId('section-payment')).toBeVisible();
    await expect(page.getByTestId('checkout-summary-card')).toBeVisible();
    await expect(page.getByTestId('checkout-items-list')).toBeVisible();
  });

  // TEST 5: Default address is pre-selected and selectable
  test('TEST 5: Default address is selected by default in checkout', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    const addrRes = await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: sampleAddress,
    });
    const addrId = (await addrRes.json()).data.address.id;

    await loginUser(page);
    await page.goto('/checkout');

    const addressOption = page.getByTestId(`address-option-${addrId}`);
    await expect(addressOption).toBeVisible();
    await expect(addressOption).toHaveClass(/selected/);
  });

  // TEST 6: User can add new address inline during checkout
  test('TEST 6: Adding a new address inline during checkout saves and selects it', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });

    await loginUser(page);
    await page.goto('/checkout');

    // Click to add address
    await page.getByTestId('checkout-add-address-btn').click();
    await expect(page.getByTestId('inline-address-form')).toBeVisible();

    await page.getByTestId('inline-name').fill('Alice Walker');
    await page.getByTestId('inline-phone').fill('9876543210');
    await page.getByTestId('inline-line1').fill('101 MG Road');
    await page.getByTestId('inline-city').fill('Pune');
    await page.getByTestId('inline-state').fill('Maharashtra');
    await page.getByTestId('inline-pin').fill('411001');

    await page.getByTestId('inline-save-address-btn').click();

    await expect(page.getByTestId('inline-address-form')).not.toBeVisible();
    await expect(page.getByText('Alice Walker')).toBeVisible();
  });

  // TEST 7: Selecting COD shows COD option and button
  test('TEST 7: COD option is selectable and ready for placement', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: sampleAddress,
    });

    await loginUser(page);
    await page.goto('/checkout');

    await expect(page.getByTestId('payment-method-cod')).toBeVisible();
    await expect(page.getByTestId('place-order-btn')).toBeVisible();
  });

  // TEST 8: Selecting Card shows card form and demo card hint
  test('TEST 8: Selecting Card displays credit/debit card inputs and demo hint', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: sampleAddress,
    });

    await loginUser(page);
    await page.goto('/checkout');

    await page.getByTestId('payment-method-card').click();
    await expect(page.getByTestId('card-details-form')).toBeVisible();
    await expect(page.getByTestId('demo-card-hint')).toBeVisible();
    await expect(page.getByTestId('input-card-holder')).toBeVisible();
    await expect(page.getByTestId('input-card-number')).toBeVisible();
    await expect(page.getByTestId('input-card-expiry')).toBeVisible();
    await expect(page.getByTestId('input-card-cvv')).toBeVisible();
  });

  // TEST 9: Card form validation displays errors on invalid card details
  test('TEST 9: Submitting invalid card details displays validation error', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: sampleAddress,
    });

    await loginUser(page);
    await page.goto('/checkout');

    await page.getByTestId('payment-method-card').click();
    await page.getByTestId('input-card-holder').fill('');
    await page.getByTestId('input-card-number').fill('1234');
    await page.getByTestId('input-card-expiry').fill('01/20');
    await page.getByTestId('input-card-cvv').fill('1');

    await page.getByTestId('place-order-btn').click();

    await expect(page.getByTestId('checkout-error-banner')).toBeVisible();
    await expect(page.getByTestId('error-card-holder')).toBeVisible();
    await expect(page.getByTestId('error-card-number')).toBeVisible();
  });

  // TEST 10: Successful COD order placement navigates to /order-confirmation/:id
  test('TEST 10: Placing COD order navigates to Order Confirmation page', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: sampleAddress,
    });

    await loginUser(page);
    await page.goto('/checkout');

    await page.getByTestId('payment-method-cod').click();
    await page.getByTestId('place-order-btn').click();

    await expect(page).toHaveURL(/\/order-confirmation\//);
    await expect(page.getByTestId('order-confirmation-page')).toBeVisible();
  });

  // TEST 11: Confirmation page displays celebration banner, order number, and delivery details
  test('TEST 11: Order Confirmation page renders order details and delivery snapshot', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: sampleAddress,
    });

    await loginUser(page);
    await page.goto('/checkout');
    await page.getByTestId('place-order-btn').click();

    await expect(page).toHaveURL(/\/order-confirmation\//);
    await expect(page.getByTestId('confirmation-hero')).toBeVisible();
    await expect(page.getByTestId('order-number')).toContainText('MS-');
    await expect(page.getByTestId('order-status')).toHaveText('CONFIRMED');
    await expect(page.getByTestId('shipping-address-card')).toBeVisible();
    await expect(page.getByTestId('order-items-card')).toBeVisible();
  });

  // TEST 12: Successful Card order placement creates SUCCESS payment status
  test('TEST 12: Placing Card order displays SUCCESS payment status on confirmation', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: sampleAddress,
    });

    await loginUser(page);
    await page.goto('/checkout');

    await page.getByTestId('payment-method-card').click();
    await page.getByTestId('input-card-holder').fill(validDemoCard.cardHolder);
    await page.getByTestId('input-card-number').fill(validDemoCard.cardNumber);
    await page.getByTestId('input-card-expiry').fill(validDemoCard.expiry);
    await page.getByTestId('input-card-cvv').fill(validDemoCard.cvv);

    await page.getByTestId('place-order-btn').click();

    await expect(page).toHaveURL(/\/order-confirmation\//);
    await expect(page.getByTestId('payment-status')).toHaveText('SUCCESS');
    await expect(page.getByTestId('transaction-id')).toContainText('DEMO-CARD-');
  });

  // TEST 13: Shopping cart counter resets to 0 after order placement
  test('TEST 13: Shopping cart counter resets after placing an order', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: sampleProduct1.id, quantity: 2 },
    });
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: sampleAddress,
    });

    await loginUser(page);
    await expect(page.getByTestId('nav-cart')).toContainText('2');

    await page.goto('/checkout');
    await page.getByTestId('place-order-btn').click();
    await expect(page).toHaveURL(/\/order-confirmation\//);

    // Nav cart should now be empty (not show (2))
    await expect(page.getByTestId('nav-cart')).toHaveText('Cart');
  });

  // TEST 14: Placed order appears in /orders (My Orders) page
  test('TEST 14: Placed order appears in My Orders history list', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: sampleAddress,
    });

    await loginUser(page);
    await page.goto('/checkout');
    await page.getByTestId('place-order-btn').click();
    await expect(page).toHaveURL(/\/order-confirmation\//);

    // Navigate to /orders
    await page.goto('/orders');
    await expect(page.getByTestId('orders-page')).toBeVisible();
    await expect(page.getByTestId('order-card').first()).toBeVisible();
    await expect(page.getByTestId('order-card').first().getByTestId('order-number')).toContainText('MS-');
  });

  // TEST 15: Orders page shows items, total, and status badge
  test('TEST 15: Orders page card renders item preview, total, and status badge', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: sampleAddress,
    });

    await loginUser(page);
    await page.goto('/checkout');
    await page.getByTestId('place-order-btn').click();
    await expect(page).toHaveURL(/\/order-confirmation\//);

    await page.goto('/orders');
    const orderCard = page.getByTestId('order-card').first();
    await expect(orderCard.getByTestId('order-status')).toHaveText('CONFIRMED');
    await expect(orderCard.getByTestId('order-total')).toBeVisible();
    await expect(orderCard.getByTestId('order-item')).toBeVisible();
  });

  // TEST 16: Clicking "View Receipt" from Orders page opens order confirmation
  test('TEST 16: Clicking "View Receipt" opens order confirmation receipt', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: sampleAddress,
    });

    await loginUser(page);
    await page.goto('/checkout');
    await page.getByTestId('place-order-btn').click();
    await expect(page).toHaveURL(/\/order-confirmation\//);

    await page.goto('/orders');
    await page.getByTestId('view-order-details-btn').first().click();
    await expect(page).toHaveURL(/\/order-confirmation\//);
    await expect(page.getByTestId('order-confirmation-page')).toBeVisible();
  });

  // TEST 17: Order Confirmation page has "View All Orders" and "Continue Shopping" buttons
  test('TEST 17: Order Confirmation action buttons navigate correctly', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: sampleAddress,
    });

    await loginUser(page);
    await page.goto('/checkout');
    await page.getByTestId('place-order-btn').click();
    await expect(page).toHaveURL(/\/order-confirmation\//);

    await page.getByTestId('view-orders-btn').click();
    await expect(page).toHaveURL('/orders');

    await page.goBack();
    await page.getByTestId('continue-shopping-btn').click();
    await expect(page).toHaveURL('/products');
  });

  // TEST 18: Stock decrement is reflected in catalog after placing an order
  test('TEST 18: Product catalog reflects decremented stock following an order', async ({ page, request }) => {
    const initRes = await request.get(`${API_BASE_URL}/api/products/${sampleProduct1.id}`);
    const initStock = (await initRes.json()).data.product.stock;

    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: sampleProduct1.id, quantity: 1 },
    });
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: sampleAddress,
    });

    await loginUser(page);
    await page.goto('/checkout');
    await page.getByTestId('place-order-btn').click();
    await expect(page).toHaveURL(/\/order-confirmation\//);

    // Verify updated stock in product details page
    await page.goto(`/products/${sampleProduct1.id}`);
    const updatedRes = await request.get(`${API_BASE_URL}/api/products/${sampleProduct1.id}`);
    const updatedStock = (await updatedRes.json()).data.product.stock;
    expect(updatedStock).toBe(initStock - 1);
  });
});
