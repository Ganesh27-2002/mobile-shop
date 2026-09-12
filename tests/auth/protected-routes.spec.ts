import { test, expect } from '@playwright/test';

test.describe('Protected Routes & Profile UI Tests', () => {
  const seededCustomer = {
    email: 'john.doe@example.com',
    password: 'Customer@123',
  };

  const seededAdmin = {
    email: 'admin@mobileshop.com',
    password: 'Admin@123',
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  // TEST 1: Unauthenticated access to /profile redirects to /login
  test('TEST 1: Logged-out user attempting to access /profile is redirected to /login with redirect query', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile/);
  });

  // TEST 2: Logged-in customer can access /profile and view profile details
  test('TEST 2: Authenticated customer can view Profile page with details and role badge', async ({ page }) => {
    // 1. Log in
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(seededCustomer.email);
    await page.getByLabel(/password/i).fill(seededCustomer.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/');

    // 2. Navigate to /profile
    await page.getByRole('link', { name: 'Profile', exact: true }).click();
    await expect(page).toHaveURL('/profile');

    // 3. Check profile elements
    await expect(page.getByTestId('profile-page')).toBeVisible();
    await expect(page.getByTestId('profile-name')).toContainText(/john doe/i);
    await expect(page.getByTestId('profile-email')).toContainText(seededCustomer.email);
    await expect(page.getByTestId('profile-role')).toHaveText('CUSTOMER');
    await expect(page.getByTestId('profile-logout-button')).toBeVisible();
  });

  // TEST 3: Authenticated admin sees ADMIN badge and Admin link in navbar
  test('TEST 3: Authenticated admin sees ADMIN role badge and Admin navigation link', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(seededAdmin.email);
    await page.getByLabel(/password/i).fill(seededAdmin.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/');

    await page.getByRole('link', { name: 'Profile', exact: true }).click();
    await expect(page).toHaveURL('/profile');
    await expect(page.getByTestId('profile-role')).toHaveText('ADMIN');

    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: /admin/i })).toBeVisible();
  });

  // TEST 4: Redirect resumption after login
  test('TEST 4: After login from a protected route, user is redirected back to intended destination', async ({ page }) => {
    // Try accessing /profile while logged out
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile/);

    // Log in
    await page.getByLabel(/email address/i).fill(seededCustomer.email);
    await page.getByLabel(/password/i).fill(seededCustomer.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should be redirected back to /profile
    await expect(page).toHaveURL('/profile');
    await expect(page.getByTestId('profile-page')).toBeVisible();
  });

  // TEST 5: Invalid/expired token in localStorage is automatically purged
  test('TEST 5: Invalid token in localStorage is purged and user is treated as unauthenticated', async ({ page }) => {
    // Inject invalid token into localStorage
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('mobile_shop_token', 'invalid-fake-token-value-12345');
    });

    // Navigate to /profile -> will fail auth verification and redirect to /login
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile/);

    // Verify invalid token was removed
    const storedToken = await page.evaluate(() => localStorage.getItem('mobile_shop_token'));
    expect(storedToken).toBeNull();
  });
});
