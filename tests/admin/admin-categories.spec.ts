import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:5173';

test.describe('Admin Category Management UI Tests (Step 8)', () => {
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
    await page.goto(`${APP_URL}/admin/categories`);
  });

  test('TEST 1: Categories table renders with headers and data rows', async ({ page }) => {
    await expect(page.locator('[data-testid="admin-categories-table"]')).toBeVisible();
    await expect(page.locator('.admin-heading')).toContainText('Product Categories');
  });

  test('TEST 2: Clicking "+ Add Category" opens modal form', async ({ page }) => {
    await page.click('[data-testid="add-category-btn"]');
    await expect(page.locator('[data-testid="category-form-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-category-name"]')).toBeVisible();
  });

  test('TEST 3: Creating a new category via modal adds it to the list', async ({ page }) => {
    const catName = `Nothing Phone Brand ${Date.now()}`;
    await page.click('[data-testid="add-category-btn"]');
    await page.fill('[data-testid="input-category-name"]', catName);
    await page.fill('[data-testid="input-category-desc"]', 'Innovative transparent design smartphones');
    await page.click('[data-testid="submit-category-btn"]');

    await expect(page.locator('[data-testid="admin-success-banner"]')).toBeVisible();
    await expect(page.getByRole('cell', { name: catName })).toBeVisible();
  });

  test('TEST 4: Duplicate category name displays error message in modal', async ({ page }) => {
    await page.click('[data-testid="add-category-btn"]');
    await page.fill('[data-testid="input-category-name"]', 'Apple');
    await page.click('[data-testid="submit-category-btn"]');

    await expect(page.locator('[data-testid="form-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="form-error"]')).toContainText('already exists');
  });

  test('TEST 5: Clicking Edit category button opens populated modal', async ({ page }) => {
    const firstEditBtn = page.locator('button[data-testid^="edit-category-btn-"]').first();
    await firstEditBtn.click();
    await expect(page.locator('[data-testid="category-form-modal"]')).toBeVisible();
    const val = await page.locator('[data-testid="input-category-name"]').inputValue();
    expect(val.length).toBeGreaterThan(0);
  });

  test('TEST 6: Editing category description updates table record', async ({ page }) => {
    const firstEditBtn = page.locator('button[data-testid^="edit-category-btn-"]').first();
    await firstEditBtn.click();
    await page.fill('[data-testid="input-category-desc"]', 'Updated brand ecosystem notes');
    await page.click('[data-testid="submit-category-btn"]');

    await expect(page.locator('[data-testid="admin-success-banner"]')).toBeVisible();
  });
});
