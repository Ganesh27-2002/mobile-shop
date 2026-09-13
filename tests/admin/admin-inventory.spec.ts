import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:5173';

test.describe('Admin Inventory Management UI Tests (Step 8)', () => {
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
    await page.goto(`${APP_URL}/admin/inventory`);
  });

  test('TEST 1: Inventory table renders with headers and stock columns', async ({ page }) => {
    await expect(page.locator('[data-testid="admin-inventory-table"]')).toBeVisible();
    await expect(page.locator('.admin-heading')).toContainText('Live Inventory Management');
  });

  test('TEST 2: Search input filters inventory table rows', async ({ page }) => {
    await page.fill('[data-testid="search-inventory-input"]', 'Ultra');
    await page.click('[data-testid="search-inventory-btn"]');
    await page.waitForTimeout(500);

    const rows = page.locator('[data-testid="admin-inventory-table"] tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('TEST 3: Status filter dropdown selects Low Stock or Out of Stock', async ({ page }) => {
    await page.selectOption('[data-testid="status-inventory-select"]', 'ALL');
    await page.waitForTimeout(500);
    const rows = page.locator('[data-testid="admin-inventory-table"] tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('TEST 4: Clicking "Adjust Stock" opens modal', async ({ page }) => {
    const firstAdjustBtn = page.locator('button[data-testid^="update-stock-btn-"]').first();
    await firstAdjustBtn.click();
    await expect(page.locator('[data-testid="inventory-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-inventory-stock"]')).toBeVisible();
  });

  test('TEST 5: Updating stock to 50 sets status to IN_STOCK', async ({ page }) => {
    const firstAdjustBtn = page.locator('button[data-testid^="update-stock-btn-"]').first();
    await firstAdjustBtn.click();
    await page.fill('[data-testid="input-inventory-stock"]', '50');
    await page.click('[data-testid="save-inventory-stock-btn"]');

    await expect(page.locator('[data-testid="inventory-success-banner"]')).toBeVisible();
  });

  test('TEST 6: Updating stock to 3 sets status to LOW_STOCK', async ({ page }) => {
    const firstAdjustBtn = page.locator('button[data-testid^="update-stock-btn-"]').first();
    await firstAdjustBtn.click();
    await page.fill('[data-testid="input-inventory-stock"]', '3');
    await page.click('[data-testid="save-inventory-stock-btn"]');

    await expect(page.locator('[data-testid="inventory-success-banner"]')).toBeVisible();
  });

  test('TEST 7: Updating stock to 0 sets status to OUT_OF_STOCK', async ({ page }) => {
    const firstAdjustBtn = page.locator('button[data-testid^="update-stock-btn-"]').first();
    await firstAdjustBtn.click();
    await page.fill('[data-testid="input-inventory-stock"]', '0');
    await page.click('[data-testid="save-inventory-stock-btn"]');

    await expect(page.locator('[data-testid="inventory-success-banner"]')).toBeVisible();

    // Replenish back to healthy 25 units
    await firstAdjustBtn.click();
    await page.fill('[data-testid="input-inventory-stock"]', '25');
    await page.click('[data-testid="save-inventory-stock-btn"]');
  });
});
