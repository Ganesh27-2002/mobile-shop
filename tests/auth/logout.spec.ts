import { test, expect } from '@playwright/test';

test.describe('Logout UI Tests', () => {
  const seededCustomer = {
    email: 'john.doe@example.com',
    password: 'Customer@123',
  };

  test('TEST 1: Logging out removes session, restores unauthenticated navbar, and restricts profile access', async ({ page }) => {
    // 1. Log in
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(seededCustomer.email);
    await page.getByLabel(/password/i).fill(seededCustomer.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify logged in
    await expect(page).toHaveURL('/');
    const nav = page.getByRole('navigation');
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();

    // 2. Click Logout
    await page.getByRole('button', { name: /logout/i }).click();

    // Verify redirected to /login
    await expect(page).toHaveURL(/\/login/);

    // Verify unauthenticated navbar
    await expect(nav.getByRole('link', { name: /login/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /signup/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /logout/i })).not.toBeVisible();

    // 3. Attempt to access protected /profile
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile/);
  });
});
