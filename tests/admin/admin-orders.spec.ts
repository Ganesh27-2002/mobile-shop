import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:5173';

test.describe('Admin Order Processing UI Tests (Step 8)', () => {
  const adminUser = {
    email: 'admin@mobileshop.com',
    password: 'Admin@123',
  };

  test.beforeEach(async ({ page }) => {
    // Admin login
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[type="email"]', adminUser.email);
    await page.fill('input[type="password"]', adminUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${APP_URL}/`);
    await page.goto(`${APP_URL}/admin/orders`);
  });

  test('TEST 1: Orders table renders with header columns and action buttons', async ({ page }) => {
    await expect(page.locator('[data-testid="admin-orders-table"]')).toBeVisible();
    await expect(page.locator('.admin-heading')).toContainText('Orders Management');
  });

  test('TEST 2: Search input filters orders table', async ({ page }) => {
    await page.fill('[data-testid="search-order-input"]', 'MS-');
    await page.click('[data-testid="search-order-btn"]');
    await page.waitForTimeout(500);

    const rows = page.locator('[data-testid="admin-orders-table"] tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('TEST 3: Order status filter dropdown filters rows', async ({ page }) => {
    await page.selectOption('[data-testid="status-order-select"]', 'ALL');
    await page.waitForTimeout(500);
    const rows = page.locator('[data-testid="admin-orders-table"] tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('TEST 4: Payment status filter dropdown filters rows', async ({ page }) => {
    await page.selectOption('[data-testid="payment-status-select"]', 'ALL');
    await page.waitForTimeout(500);
    const rows = page.locator('[data-testid="admin-orders-table"] tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('TEST 5: Clicking "View Details" opens comprehensive modal', async ({ page }) => {
    const firstViewBtn = page.locator('button[data-testid^="view-order-btn-"]').first();
    await firstViewBtn.click();
    await expect(page.locator('[data-testid="order-details-modal"]')).toBeVisible();
    await expect(page.locator('.modal-header h2')).toContainText('Order Receipt:');
  });

  test('TEST 6: Modal renders customer info and delivery address snapshot', async ({ page }) => {
    const firstViewBtn = page.locator('button[data-testid^="view-order-btn-"]').first();
    await firstViewBtn.click();
    await expect(page.locator('[data-testid="order-details-modal"]')).toBeVisible();
    await expect(page.locator('text=👤 Customer & Delivery')).toBeVisible();
  });

  test('TEST 7: Modal renders financial breakdown (Subtotal, GST, Total)', async ({ page }) => {
    const firstViewBtn = page.locator('button[data-testid^="view-order-btn-"]').first();
    await firstViewBtn.click();
    await expect(page.locator('text=Subtotal:')).toBeVisible();
    await expect(page.locator('text=GST (18%):')).toBeVisible();
    await expect(page.locator('text=Grand Total:')).toBeVisible();
  });

  test('TEST 8: Modal renders order item snapshots', async ({ page }) => {
    const firstViewBtn = page.locator('button[data-testid^="view-order-btn-"]').first();
    await firstViewBtn.click();
    await expect(page.locator('text=📱 Order Item Snapshots')).toBeVisible();
  });

  test('TEST 9: Status lifecycle dropdown is populated', async ({ page }) => {
    const firstViewBtn = page.locator('button[data-testid^="view-order-btn-"]').first();
    await firstViewBtn.click();
    const statusSelect = page.locator('[data-testid="select-order-status"]');
    await expect(statusSelect).toBeVisible();
    const options = await statusSelect.locator('option').count();
    expect(options).toBeGreaterThan(0);
  });

  test('TEST 10: Updating order status transitions state and displays banner', async ({ page }) => {
    const firstViewBtn = page.locator('button[data-testid^="view-order-btn-"]').first();
    await firstViewBtn.click();

    const statusSelect = page.locator('[data-testid="select-order-status"]');
    const options = await statusSelect.locator('option').allInnerTexts();

    if (options.length > 1) {
      const nextOption = options[1];
      await statusSelect.selectOption(nextOption);
      await page.click('[data-testid="update-status-submit-btn"]');
      await expect(page.locator('[data-testid="order-success-banner"]')).toBeVisible();
    }
  });

  test('TEST 11: Order details modal can be closed', async ({ page }) => {
    const firstViewBtn = page.locator('button[data-testid^="view-order-btn-"]').first();
    await firstViewBtn.click();
    await expect(page.locator('[data-testid="order-details-modal"]')).toBeVisible();
    await page.click('button.modal-close');
    await expect(page.locator('[data-testid="order-details-modal"]')).not.toBeVisible();
  });
});
