import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:5173';
const API_BASE_URL = 'http://localhost:5000';

test.describe('Order Tracking UI Tests (Step 9)', () => {
  const customerUser = {
    email: 'john.doe@example.com',
    password: 'Customer@123',
  };

  test.beforeEach(async ({ page, request }) => {
    // 1. Ensure user has at least one order placed
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: customerUser,
    });
    const token = (await loginRes.json()).data.token;

    // Get an address
    const addrRes = await request.get(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    let addressId = (await addrRes.json()).data.addresses?.[0]?.id;
    if (!addressId) {
      const createAddrRes = await request.post(`${API_BASE_URL}/api/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          fullName: 'John Doe Tracking UI',
          phone: '9876543210',
          addressLine1: '789 Track St',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      });
      addressId = (await createAddrRes.json()).data.address.id;
    }

    const prodRes = await request.get(`${API_BASE_URL}/api/products?limit=1`);
    const prodId = (await prodRes.json()).data.products[0].id;

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

    // 2. Login via UI
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[type="email"]', customerUser.email);
    await page.fill('input[type="password"]', customerUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${APP_URL}/`);
  });

  test('TEST 1: Customer can navigate from My Orders to Order Tracking page', async ({ page }) => {
    await page.goto(`${APP_URL}/orders`);
    await expect(page.locator('[data-testid="orders-page"]')).toBeVisible();

    const trackBtn = page.locator('[data-testid="track-order-btn"]').first();
    await expect(trackBtn).toBeVisible();
    await trackBtn.click();

    await expect(page).toHaveURL(/.*\/orders\/.*\/tracking/);
    await expect(page.locator('[data-testid="order-tracking-page"]')).toBeVisible();
  });

  test('TEST 2: Tracking page displays order number and current status badge', async ({ page }) => {
    await page.goto(`${APP_URL}/orders`);
    await page.locator('[data-testid="track-order-btn"]').first().click();

    await expect(page.locator('[data-testid="tracking-order-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="tracking-current-status"]')).toBeVisible();
  });

  test('TEST 3: Tracking page renders timeline stepper with all milestone steps', async ({ page }) => {
    await page.goto(`${APP_URL}/orders`);
    await page.locator('[data-testid="track-order-btn"]').first().click();

    await expect(page.locator('[data-testid="order-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeline-step-placed"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeline-step-confirmed"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeline-step-processing"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeline-step-shipped"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeline-step-delivered"]')).toBeVisible();
  });

  test('TEST 4: Placed milestone step displays completed indicator and date', async ({ page }) => {
    await page.goto(`${APP_URL}/orders`);
    await page.locator('[data-testid="track-order-btn"]').first().click();

    const placedStep = page.locator('[data-testid="timeline-step-placed"]');
    await expect(placedStep).toContainText('COMPLETED');
    await expect(placedStep.locator('[data-testid="step-node-placed"]')).toContainText('✓');
  });

  test('TEST 5: Action buttons navigate correctly from tracking page', async ({ page }) => {
    await page.goto(`${APP_URL}/orders`);
    await page.locator('[data-testid="track-order-btn"]').first().click();

    const backBtn = page.locator('[data-testid="back-to-orders-btn"]');
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    await expect(page).toHaveURL(`${APP_URL}/orders`);
  });
});
