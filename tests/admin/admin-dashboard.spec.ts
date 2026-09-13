import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:5173';

test.describe('Admin Dashboard UI Tests (Step 8)', () => {
  const adminUser = {
    email: 'admin@mobileshop.com',
    password: 'Admin@123',
  };

  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[type="email"]', adminUser.email);
    await page.fill('input[type="password"]', adminUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${APP_URL}/`);
    await page.goto(`${APP_URL}/admin`);
  });

  test('TEST 1: Admin dashboard loads with layout and page title', async ({ page }) => {
    await expect(page.locator('[data-testid="admin-layout"]')).toBeVisible();
    await expect(page.locator('.admin-heading')).toContainText('Store Analytics');
  });

  test('TEST 2: Statistics grid renders all 4 KPI cards', async ({ page }) => {
    const grid = page.locator('[data-testid="admin-stats-grid"]');
    await expect(grid).toBeVisible();
    await expect(page.locator('[data-testid="stat-products"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-customers"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-revenue"]')).toBeVisible();
  });

  test('TEST 3: Products card renders numeric total and stock breakdown', async ({ page }) => {
    const card = page.locator('[data-testid="stat-products"]');
    await expect(card.locator('.stat-card-value')).toBeVisible();
    await expect(card.locator('.badge-success')).toContainText('Active');
  });

  test('TEST 4: Revenue card renders properly formatted INR amount', async ({ page }) => {
    const card = page.locator('[data-testid="stat-revenue"]');
    await expect(card.locator('.stat-card-value')).toContainText('₹');
  });

  test('TEST 5: Recent Orders card is rendered with table or empty state', async ({ page }) => {
    const section = page.locator('[data-testid="recent-orders-section"]');
    await expect(section).toBeVisible();
  });

  test('TEST 6: Inventory alerts / low stock section is visible', async ({ page }) => {
    const section = page.locator('[data-testid="low-stock-section"]');
    await expect(section).toBeVisible();
  });

  test('TEST 7: Refresh Data button triggers live reload', async ({ page }) => {
    const refreshBtn = page.locator('[data-testid="refresh-stats-btn"]');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    await expect(page.locator('[data-testid="admin-stats-grid"]')).toBeVisible();
  });

  test('TEST 8: Sidebar navigation links navigate to appropriate sections', async ({ page }) => {
    // Navigate to Products
    await page.click('[data-testid="admin-nav-products"]');
    await expect(page).toHaveURL(`${APP_URL}/admin/products`);

    // Navigate to Categories
    await page.click('[data-testid="admin-nav-categories"]');
    await expect(page).toHaveURL(`${APP_URL}/admin/categories`);

    // Navigate to Inventory
    await page.click('[data-testid="admin-nav-inventory"]');
    await expect(page).toHaveURL(`${APP_URL}/admin/inventory`);

    // Navigate to Orders
    await page.click('[data-testid="admin-nav-orders"]');
    await expect(page).toHaveURL(`${APP_URL}/admin/orders`);

    // Navigate to Customers
    await page.click('[data-testid="admin-nav-customers"]');
    await expect(page).toHaveURL(`${APP_URL}/admin/customers`);
  });
});
