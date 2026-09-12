import { test, expect } from '@playwright/test';

test.describe('Login UI Tests', () => {
  const seededCustomer = {
    email: 'john.doe@example.com',
    password: 'Customer@123',
  };

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  // TEST 1: Login page loads
  test('TEST 1: Login page loads with email, password, submit button, and signup link', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2, name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /create an account/i })).toBeVisible();
  });

  // TEST 2: Successful login
  test('TEST 2: Successful login redirects to Home/Profile and shows authenticated navbar', async ({ page }) => {
    await page.getByLabel(/email address/i).fill(seededCustomer.email);
    await page.getByLabel(/password/i).fill(seededCustomer.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify redirected to Home (or landing page)
    await expect(page).toHaveURL('/');

    // Verify authenticated navigation items are visible
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: /profile/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /orders/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();

    // Verify Login and Signup are no longer shown in nav
    await expect(nav.getByRole('link', { name: /login/i })).not.toBeVisible();
    await expect(nav.getByRole('link', { name: /signup/i })).not.toBeVisible();
  });

  // TEST 3: Invalid password
  test('TEST 3: Login with invalid password displays error message and keeps user logged out', async ({ page }) => {
    await page.getByLabel(/email address/i).fill(seededCustomer.email);
    await page.getByLabel(/password/i).fill('WrongPassword@999');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Error alert is visible
    const errorAlert = page.getByTestId('login-error');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/invalid email or password/i);

    // User remains on /login
    await expect(page).toHaveURL(/\/login/);
  });

  // TEST 4: Invalid email format
  test('TEST 4: Invalid email format triggers client validation error', async ({ page }) => {
    await page.getByLabel(/email address/i).fill('not-an-email');
    await page.getByLabel(/password/i).fill('SomePassword@123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email address format/i)).toBeVisible();
  });

  // TEST 5: Empty fields validation
  test('TEST 5: Submitting empty form displays validation errors', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });
});
