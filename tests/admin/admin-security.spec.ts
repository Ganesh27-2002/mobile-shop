import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:5173';

test.describe('Admin Security & RBAC Isolation UI Tests (Step 8)', () => {
  const customerUser = {
    email: 'john.doe@example.com',
    password: 'Customer@123',
  };

  const adminUser = {
    email: 'admin@mobileshop.com',
    password: 'Admin@123',
  };

  test.beforeEach(async ({ page }) => {
    await page.goto(`${APP_URL}/`);
    await page.evaluate(() => localStorage.clear());
  });

  test('TEST 1: Unauthenticated user navigating to /admin redirects to login with redirect parameter', async ({ page }) => {
    await page.goto(`${APP_URL}/admin`);
    await expect(page).toHaveURL(/.*\/login\?redirect=%2Fadmin/);
    await expect(page.locator('.auth-title')).toContainText('Welcome Back');
  });

  test('TEST 2: Unauthenticated user navigating to /admin/products redirects to login', async ({ page }) => {
    await page.goto(`${APP_URL}/admin/products`);
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('TEST 3: Unauthenticated user navigating to /admin/categories redirects to login', async ({ page }) => {
    await page.goto(`${APP_URL}/admin/categories`);
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('TEST 4: Unauthenticated user navigating to /admin/inventory redirects to login', async ({ page }) => {
    await page.goto(`${APP_URL}/admin/inventory`);
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('TEST 5: Unauthenticated user navigating to /admin/orders redirects to login', async ({ page }) => {
    await page.goto(`${APP_URL}/admin/orders`);
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('TEST 6: Unauthenticated user navigating to /admin/customers redirects to login', async ({ page }) => {
    await page.goto(`${APP_URL}/admin/customers`);
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('TEST 7: Logged-in Customer navigating to /admin displays 403 Access Denied screen', async ({ page }) => {
    // Login as Customer
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[type="email"]', customerUser.email);
    await page.fill('input[type="password"]', customerUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${APP_URL}/`);

    // Attempt to navigate to /admin
    await page.goto(`${APP_URL}/admin`);
    const deniedCard = page.locator('[data-testid="admin-access-denied"]');
    await expect(deniedCard).toBeVisible();
    await expect(deniedCard).toContainText('403 - Access Denied');
    await expect(deniedCard).toContainText('Administrator privileges are required');
  });

  test('TEST 8: Customer user navigation bar does not display Admin link', async ({ page }) => {
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[type="email"]', customerUser.email);
    await page.fill('input[type="password"]', customerUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${APP_URL}/`);

    const adminLink = page.locator('nav a.admin-link');
    await expect(adminLink).not.toBeVisible();
  });

  test('TEST 9: Customer navigating to /admin/inventory displays 403 Access Denied screen', async ({ page }) => {
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[type="email"]', customerUser.email);
    await page.fill('input[type="password"]', customerUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${APP_URL}/`);

    await page.goto(`${APP_URL}/admin/inventory`);
    await expect(page.locator('[data-testid="admin-access-denied"]')).toBeVisible();
  });

  test('TEST 10: Customer navigating to /admin/orders displays 403 Access Denied screen', async ({ page }) => {
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[type="email"]', customerUser.email);
    await page.fill('input[type="password"]', customerUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${APP_URL}/`);

    await page.goto(`${APP_URL}/admin/orders`);
    await expect(page.locator('[data-testid="admin-access-denied"]')).toBeVisible();
  });

  test('TEST 11: Admin user login displays Admin link in Navbar and accesses /admin successfully', async ({ page }) => {
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[type="email"]', adminUser.email);
    await page.fill('input[type="password"]', adminUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${APP_URL}/`);

    // Admin link should be visible in navbar
    const adminLink = page.locator('nav a:has-text("Admin")');
    await expect(adminLink).toBeVisible();

    await adminLink.click();
    await expect(page).toHaveURL(`${APP_URL}/admin`);
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
  });
});
