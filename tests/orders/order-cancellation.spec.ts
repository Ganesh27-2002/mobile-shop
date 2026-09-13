import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:5173';
const API_BASE_URL = 'http://localhost:5000';

test.describe('Order Cancellation UI Tests (Step 9)', () => {
  const customerUser = {
    email: 'john.doe@example.com',
    password: 'Customer@123',
  };

  test.beforeEach(async ({ page }) => {
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[type="email"]', customerUser.email);
    await page.fill('input[type="password"]', customerUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${APP_URL}/`);
  });

  test('TEST 1: Customer can open Cancel Order modal from Orders page', async ({ page, request }) => {
    // Ensure an order is placed
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: customerUser,
    });
    const token = (await loginRes.json()).data.token;

    const prodRes = await request.get(`${API_BASE_URL}/api/products?limit=1`);
    const prodId = (await prodRes.json()).data.products[0].id;

    const addrRes = await request.get(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const addressId = (await addrRes.json()).data.addresses[0].id;

    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: prodId, quantity: 1 },
    });

    await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        addressId,
        paymentMethod: 'COD',
      },
    });

    await page.goto(`${APP_URL}/orders`);
    const cancelBtn = page.locator('[data-testid="cancel-order-btn"]').first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    await expect(page.locator('[data-testid="cancel-order-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="cancel-reason-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirm-cancel-order-btn"]')).toBeVisible();
  });

  test('TEST 2: Clicking "Keep Order" in modal dismisses the dialog', async ({ page }) => {
    await page.goto(`${APP_URL}/orders`);
    const cancelBtn = page.locator('[data-testid="cancel-order-btn"]').first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await expect(page.locator('[data-testid="cancel-order-modal"]')).toBeVisible();

      await page.click('[data-testid="keep-order-btn"]');
      await expect(page.locator('[data-testid="cancel-order-modal"]')).not.toBeVisible();
    }
  });

  test('TEST 3: Confirming cancellation cancels order and displays success toast', async ({ page, request }) => {
    // Create new order to cancel
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: customerUser,
    });
    const token = (await loginRes.json()).data.token;

    const prodRes = await request.get(`${API_BASE_URL}/api/products?limit=1`);
    const prodId = (await prodRes.json()).data.products[0].id;

    const addrRes = await request.get(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const addressId = (await addrRes.json()).data.addresses[0].id;

    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: prodId, quantity: 1 },
    });

    const createOrderRes = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        addressId,
        paymentMethod: 'COD',
      },
    });
    const createdOrder = (await createOrderRes.json()).data.order;

    await page.goto(`${APP_URL}/orders`);
    const orderCard = page.locator('[data-testid="order-card"]').first();
    await expect(orderCard).toBeVisible();

    const cancelBtn = orderCard.locator('[data-testid="cancel-order-btn"]');
    await cancelBtn.click();

    await page.fill('[data-testid="cancel-reason-input"]', 'I found a better price elsewhere');
    await page.click('[data-testid="confirm-cancel-order-btn"]');

    await expect(page.locator('[data-testid="orders-success-banner"]')).toBeVisible();
    await expect(orderCard.locator('[data-testid="order-status"]')).toHaveText('CANCELLED');
    await expect(orderCard.locator('[data-testid="cancel-order-btn"]')).not.toBeVisible();
  });

  test('TEST 4: Cancelled order tracking page displays cancellation notice banner', async ({ page, request }) => {
    // Create & Cancel an order
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: customerUser,
    });
    const token = (await loginRes.json()).data.token;

    const prodRes = await request.get(`${API_BASE_URL}/api/products?limit=1`);
    const prodId = (await prodRes.json()).data.products[0].id;

    const addrRes = await request.get(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const addressId = (await addrRes.json()).data.addresses[0].id;

    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { productId: prodId, quantity: 1 },
    });

    const createOrderRes = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        addressId,
        paymentMethod: 'COD',
      },
    });
    const createdOrder = (await createOrderRes.json()).data.order;

    await request.post(`${API_BASE_URL}/api/orders/${createdOrder.id}/cancel`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { reason: 'UI Verification Cancel' },
    });

    // Visit tracking page
    await page.goto(`${APP_URL}/orders/${createdOrder.id}/tracking`);
    await expect(page.locator('[data-testid="cancelled-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="cancelled-banner"]')).toContainText('This Order has been Cancelled');
    await expect(page.locator('[data-testid="cancelled-banner"]')).toContainText('UI Verification Cancel');
  });
});
