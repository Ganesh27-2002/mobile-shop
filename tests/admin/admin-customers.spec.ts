import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:5173';

test.describe('Admin Customer Accounts UI Tests (Step 8)', () => {
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
    await page.goto(`${APP_URL}/admin/customers`);
  });

  test('TEST 1: Customers table renders with headers and data rows', async ({ page }) => {
    await expect(page.locator('[data-testid="admin-customers-table"]')).toBeVisible();
    await expect(page.locator('.admin-heading')).toContainText('Registered Customers');
  });

  test('TEST 2: Customer search filters table by name', async ({ page }) => {
    await page.fill('[data-testid="search-customer-input"]', 'John');
    await page.click('[data-testid="search-customer-btn"]');
    await page.waitForTimeout(500);

    const rows = page.locator('[data-testid="admin-customers-table"] tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('TEST 3: Customer search filters table by email', async ({ page }) => {
    await page.fill('[data-testid="search-customer-input"]', 'jane.smith@example.com');
    await page.click('[data-testid="search-customer-btn"]');
    await page.waitForTimeout(500);

    const rows = page.locator('[data-testid="admin-customers-table"] tbody tr');
    expect(await rows.count()).toBe(1);
  });

  test('TEST 4: Customer lifetime spent column displays formatted currency', async ({ page }) => {
    const firstSpent = page.locator('td[data-testid^="customer-spent-"]').first();
    await expect(firstSpent).toBeVisible();
    await expect(firstSpent).toContainText('₹');
  });

  test('TEST 5: Clicking "View Details" opens customer profile modal', async ({ page }) => {
    const firstViewBtn = page.locator('button[data-testid^="view-customer-btn-"]').first();
    await firstViewBtn.click();
    await expect(page.locator('[data-testid="customer-detail-modal"]')).toBeVisible();
    await expect(page.locator('.modal-header h2')).toContainText('Customer Profile:');
  });

  test('TEST 6: Modal renders Account Overview and lifetime spend', async ({ page }) => {
    const firstViewBtn = page.locator('button[data-testid^="view-customer-btn-"]').first();
    await firstViewBtn.click();
    await expect(page.locator('text=👤 Account Overview')).toBeVisible();
    await expect(page.locator('text=Lifetime Spend:')).toBeVisible();
  });

  test('TEST 7: Modal renders Saved Addresses section', async ({ page }) => {
    const firstViewBtn = page.locator('button[data-testid^="view-customer-btn-"]').first();
    await firstViewBtn.click();
    await expect(page.locator('text=📍 Saved Addresses')).toBeVisible();
  });

  test('TEST 8: Modal renders Order History table', async ({ page }) => {
    const firstViewBtn = page.locator('button[data-testid^="view-customer-btn-"]').first();
    await firstViewBtn.click();
    await expect(page.locator('text=🛍️ Order History')).toBeVisible();
  });
});
