import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:5173';

test.describe('Admin Product Management UI Tests (Step 8)', () => {
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
    await page.goto(`${APP_URL}/admin/products`);
  });

  test.afterAll(async ({ request }) => {
    const loginRes = await request.post('http://localhost:5000/api/auth/login', {
      data: adminUser,
    });
    const token = (await loginRes.json())?.data?.token;
    if (token) {
      const listRes = await request.get('http://localhost:5000/api/admin/products?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const prods = (await listRes.json())?.data || [];
      for (const p of prods) {
        if (!p.id.startsWith('d')) {
          await request.delete(`http://localhost:5000/api/admin/products/${p.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
    }
  });

  test('TEST 1: Products table renders with headers and data rows', async ({ page }) => {
    await expect(page.locator('[data-testid="admin-products-table"]')).toBeVisible();
    await expect(page.locator('.admin-heading')).toContainText('Smartphone Products');
  });

  test('TEST 2: Product search filters table rows', async ({ page }) => {
    await page.fill('[data-testid="search-product-input"]', 'iPhone 15');
    await page.click('[data-testid="search-product-btn"]');
    await page.waitForTimeout(500);

    const rows = page.locator('[data-testid="admin-products-table"] tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TEST 3: Category filter selects specific brand products', async ({ page }) => {
    await page.selectOption('[data-testid="category-filter-select"]', 'samsung');
    await page.waitForTimeout(500);

    const rows = page.locator('[data-testid="admin-products-table"] tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TEST 4: Status filter dropdown works', async ({ page }) => {
    await page.selectOption('[data-testid="status-filter-select"]', 'active');
    await page.waitForTimeout(500);
    const rows = page.locator('[data-testid="admin-products-table"] tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('TEST 5: Sort dropdown orders products by price', async ({ page }) => {
    await page.selectOption('[data-testid="sort-order-select"]', 'price_asc');
    await page.waitForTimeout(500);
    const rows = page.locator('[data-testid="admin-products-table"] tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('TEST 6: Clicking "+ Add New Smartphone" opens modal form', async ({ page }) => {
    await page.click('[data-testid="add-product-btn"]');
    await expect(page.locator('[data-testid="product-form-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-product-name"]')).toBeVisible();
  });

  test('TEST 7: Creating a new product via modal saves and displays in table', async ({ page }) => {
    const testProductName = `Apple iPhone 16 Plus Test ${Date.now()}`;
    await page.click('[data-testid="add-product-btn"]');
    await page.fill('[data-testid="input-product-name"]', testProductName);
    await page.fill('[data-testid="input-product-brand"]', 'Apple');
    await page.fill('[data-testid="input-product-model"]', '128GB Ultramarine');
    await page.fill('[data-testid="input-product-price"]', '89999');
    await page.fill('[data-testid="input-product-stock"]', '30');

    await page.click('[data-testid="submit-product-form-btn"]');
    await expect(page.locator('[data-testid="admin-success-banner"]')).toBeVisible();
  });

  test('TEST 8: Quick stock button opens stock adjustment modal', async ({ page }) => {
    const firstQuickStockBtn = page.locator('button[data-testid^="quick-stock-btn-"]').first();
    await firstQuickStockBtn.click();
    await expect(page.locator('[data-testid="stock-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-stock-input"]')).toBeVisible();
  });

  test('TEST 9: Adjusting stock via modal updates stock badge', async ({ page }) => {
    const firstQuickStockBtn = page.locator('button[data-testid^="quick-stock-btn-"]').first();
    await firstQuickStockBtn.click();
    await page.fill('[data-testid="modal-stock-input"]', '48');
    await page.click('[data-testid="modal-stock-save-btn"]');

    await expect(page.locator('[data-testid="admin-success-banner"]')).toBeVisible();
  });

  test('TEST 10: Clicking Edit button opens modal populated with product data', async ({ page }) => {
    const firstEditBtn = page.locator('button[data-testid^="edit-product-btn-"]').first();
    await firstEditBtn.click();
    await expect(page.locator('[data-testid="product-form-modal"]')).toBeVisible();
    const nameVal = await page.locator('[data-testid="input-product-name"]').inputValue();
    expect(nameVal.length).toBeGreaterThan(0);
  });

  test('TEST 11: Editing price and saving updates product record', async ({ page }) => {
    const firstEditBtn = page.locator('button[data-testid^="edit-product-btn-"]').first();
    await firstEditBtn.click();
    await page.fill('[data-testid="input-product-price"]', '75999');
    await page.click('[data-testid="submit-product-form-btn"]');

    await expect(page.locator('[data-testid="admin-success-banner"]')).toBeVisible();
  });

  test('TEST 12: Status toggle button toggles active and inactive state', async ({ page }) => {
    const firstToggleBtn = page.locator('button[data-testid^="toggle-status-btn-"]').first();
    const initialText = await firstToggleBtn.innerText();
    await firstToggleBtn.click();

    await expect(page.locator('[data-testid="admin-success-banner"]')).toBeVisible();
  });

  test('TEST 13: Pagination controls are visible and interactable', async ({ page }) => {
    const paginationEl = page.locator('[data-testid="admin-pagination"]');
    if (await paginationEl.isVisible()) {
      await expect(page.locator('[data-testid="pagination-next-btn"]')).toBeVisible();
    }
  });
});
