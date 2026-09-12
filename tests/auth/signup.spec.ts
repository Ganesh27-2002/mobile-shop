import { test, expect } from '@playwright/test';

test.describe('Signup UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  // TEST 1: Signup page loads
  test('TEST 1: Signup page loads with all input fields and submit button', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2, name: /create an account/i })).toBeVisible();
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/phone number/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  // TEST 2: Successful signup
  test('TEST 2: Successful signup displays success message and redirects to login', async ({ page }) => {
    const uniqueEmail = `playwright-${Date.now()}-${Math.random().toString(36).substring(2, 6)}@example.com`;

    await page.getByLabel(/first name/i).fill('Charlie');
    await page.getByLabel(/last name/i).fill('Brown');
    await page.getByLabel(/email address/i).fill(uniqueEmail);
    await page.getByLabel(/phone number/i).fill('+91 9876543210');
    await page.getByLabel(/^password$/i).fill('Password@123');
    await page.getByLabel(/confirm password/i).fill('Password@123');

    await page.getByRole('button', { name: /create account/i }).click();

    // Success alert is shown
    await expect(page.getByTestId('signup-success')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('signup-success')).toContainText(/account created successfully/i);

    // Redirected to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 7000 });
  });

  // TEST 3: Duplicate email
  test('TEST 3: Registering with an existing email shows duplicate email error', async ({ page }) => {
    const seededEmail = 'john.doe@example.com';

    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Duplicate');
    await page.getByLabel(/email address/i).fill(seededEmail);
    await page.getByLabel(/^password$/i).fill('Password@123');
    await page.getByLabel(/confirm password/i).fill('Password@123');

    await page.getByRole('button', { name: /create account/i }).click();

    const errorAlert = page.getByTestId('signup-error');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/already registered/i);
  });

  // TEST 4: Invalid email format
  test('TEST 4: Invalid email format triggers client validation error', async ({ page }) => {
    await page.getByLabel(/first name/i).fill('Test');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/email address/i).fill('bad-email-format');
    await page.getByLabel(/^password$/i).fill('Password@123');
    await page.getByLabel(/confirm password/i).fill('Password@123');

    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/invalid email address/i)).toBeVisible();
  });

  // TEST 5: Password mismatch
  test('TEST 5: Password mismatch triggers validation error', async ({ page }) => {
    await page.getByLabel(/first name/i).fill('Test');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/email address/i).fill('valid@example.com');
    await page.getByLabel(/^password$/i).fill('Password@123');
    await page.getByLabel(/confirm password/i).fill('DifferentPassword@456');

    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  // TEST 6: Weak password
  test('TEST 6: Password with fewer than 6 characters triggers validation error', async ({ page }) => {
    await page.getByLabel(/first name/i).fill('Test');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/email address/i).fill('valid@example.com');
    await page.getByLabel(/^password$/i).fill('123');
    await page.getByLabel(/confirm password/i).fill('123');

    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/password must be at least 6 characters long/i)).toBeVisible();
  });

  // TEST 7: Missing required fields
  test('TEST 7: Submitting empty form displays all required field errors', async ({ page }) => {
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/first name is required/i)).toBeVisible();
    await expect(page.getByText(/last name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });
});
