import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:5173';
const API_BASE_URL = 'http://localhost:5000';

test.describe('Admin Order Lifecycle UI & Security Tests (Step 9)', () => {
  const adminUser = {
    email: 'admin@mobileshop.com',
    password: 'Admin@123',
  };

  const customerUser = {
    email: 'john.doe@example.com',
    password: 'Customer@123',
  };

  let testOrderId: string;

  test.beforeAll(async ({ request }) => {
    // 1. Ensure a fresh order is placed
    const custRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: customerUser,
    });
    const custToken = (await custRes.json()).data.token;

    const prodRes = await request.get(`${API_BASE_URL}/api/products?limit=1`);
    const prodId = (await prodRes.json()).data.products[0].id;

    const addrRes = await request.get(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    const addressId = (await addrRes.json()).data.addresses[0].id;

    await request.post(`${API_BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${custToken}` },
      data: { productId: prodId, quantity: 1 },
    });

    const orderRes = await request.post(`${API_BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${custToken}` },
      data: {
        addressId,
        paymentMethod: 'COD',
      },
    });
    testOrderId = (await orderRes.json()).data.order.id;
  });

  test('TEST 1: Admin can open order modal and progress status to PROCESSING', async ({ page }) => {
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[type="email"]', adminUser.email);
    await page.fill('input[type="password"]', adminUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${APP_URL}/`);

    await page.goto(`${APP_URL}/admin/orders`);
    await expect(page.locator('[data-testid="admin-orders-page"]')).toBeVisible();

    const viewBtn = page.locator(`[data-testid="view-order-btn-${testOrderId}"]`);
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
    } else {
      await page.locator('[data-testid^="view-order-btn-"]').first().click();
    }

    await expect(page.locator('[data-testid="order-details-modal"]')).toBeVisible();

    // Select PROCESSING
    await page.selectOption('[data-testid="select-order-status"]', 'PROCESSING');
    await page.click('[data-testid="update-status-submit-btn"]');

    await expect(page.locator('[data-testid="order-success-banner"]')).toBeVisible();
  });

  test('TEST 2: Admin can open dedicated order detail page at /admin/orders/:id', async ({ page }) => {
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[type="email"]', adminUser.email);
    await page.fill('input[type="password"]', adminUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${APP_URL}/`);

    await page.goto(`${APP_URL}/admin/orders/${testOrderId}`);
    await expect(page.locator('[data-testid="admin-order-detail-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-timeline-card"]')).toBeVisible();
  });

  test('TEST 3: Customer is blocked from accessing /admin/orders/:id (RBAC)', async ({ page }) => {
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[type="email"]', customerUser.email);
    await page.fill('input[type="password"]', customerUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${APP_URL}/`);

    await page.goto(`${APP_URL}/admin/orders/${testOrderId}`);
    const deniedCard = page.locator('[data-testid="admin-access-denied"]');
    await expect(deniedCard).toBeVisible();
    await expect(deniedCard).toContainText('403 - Access Denied');
  });
});
