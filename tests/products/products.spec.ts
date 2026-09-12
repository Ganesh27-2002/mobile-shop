import { test, expect } from '@playwright/test';

test.describe('Product Catalog & Details UI Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // TEST 1: Products page loads with all essential controls
  test('TEST 1: Products page loads with heading, search input, category filter, sort dropdown, and grid', async ({ page }) => {
    await page.goto('/products');

    await expect(page.getByRole('heading', { level: 1, name: /smartphone catalog/i })).toBeVisible();
    await expect(page.getByTestId('product-search')).toBeVisible();
    await expect(page.getByTestId('category-filter')).toBeVisible();
    await expect(page.getByTestId('sort-products')).toBeVisible();
    await expect(page.getByTestId('product-grid')).toBeVisible();
  });

  // TEST 2: Products are displayed in the grid
  test('TEST 2: Product cards appear with image, brand, title, price, and stock status', async ({ page }) => {
    await page.goto('/products');

    const cards = page.getByTestId('product-card');
    await expect(cards.first()).toBeVisible();
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    const firstCard = cards.first();
    await expect(firstCard.locator('.product-brand-badge')).toBeVisible();
    await expect(firstCard.getByTestId('product-name')).toBeVisible();
    await expect(firstCard.getByTestId('product-price')).toBeVisible();
    await expect(firstCard.locator('.stock-badge')).toBeVisible();
    await expect(firstCard.getByTestId('product-details-button')).toBeVisible();
  });

  // TEST 3: Search for a product
  test('TEST 3: Searching for "iPhone" filters the grid to iPhone models', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByTestId('product-card').first()).toBeVisible();

    const searchInput = page.getByTestId('product-search');
    await searchInput.fill('iPhone');
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/products') && res.url().includes('search=iPhone') && res.status() === 200),
      searchInput.press('Enter'),
    ]);
    expect(response.status()).toBe(200);

    // Wait for search result cards
    await expect(page).toHaveURL(/search=iPhone/);
    await expect(page.getByTestId('product-grid')).toBeVisible();
    const cards = page.getByTestId('product-card');
    await expect(cards.first().getByTestId('product-name')).toContainText(/iphone/i);

    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).getByTestId('product-name')).toContainText(/iphone/i);
    }
  });

  // TEST 4: Search for non-existent product
  test('TEST 4: Searching for non-existent product shows "No products found" empty state', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByTestId('product-card').first()).toBeVisible();

    const searchInput = page.getByTestId('product-search');
    await searchInput.fill('xyz-nonexistent-mobile');
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/products') && res.status() === 200),
      searchInput.press('Enter'),
    ]);
    expect(response.status()).toBe(200);

    await expect(page).toHaveURL(/search=xyz-nonexistent-mobile/);
    await expect(page.getByTestId('product-empty')).toBeVisible();
    await expect(page.getByText(/no products found/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /clear filters/i })).toBeVisible();
  });

  // TEST 5: Category filter
  test('TEST 5: Category filter displays only products in selected category', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByTestId('product-card').first()).toBeVisible();

    // Select "Apple" from category filter
    const categorySelect = page.getByTestId('category-filter');
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/products') && res.url().includes('category=apple') && res.status() === 200),
      categorySelect.selectOption({ label: 'Apple' }),
    ]);
    expect(response.status()).toBe(200);

    await expect(page).toHaveURL(/category=apple/);
    await expect(page.getByTestId('product-grid')).toBeVisible();
    const cards = page.getByTestId('product-card');
    await expect(cards.first()).toBeVisible();

    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).locator('.product-brand-badge')).toHaveText(/apple/i);
    }
  });

  // TEST 6: Sort by price low-to-high
  test('TEST 6: Sort by price low-to-high orders product cards in ascending price order', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByTestId('product-card').first()).toBeVisible();

    const sortSelect = page.getByTestId('sort-products');
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/products') && res.url().includes('sort=price_asc') && res.status() === 200),
      sortSelect.selectOption('price_asc'),
    ]);
    expect(response.status()).toBe(200);

    await expect(page).toHaveURL(/sort=price_asc/);
    await expect(page.getByTestId('product-card').first()).toBeVisible();

    // Parse displayed formatted prices (e.g. ₹39,999)
    const priceElements = await page.getByTestId('product-price').allTextContents();
    const prices = priceElements.map((p) => parseInt(p.replace(/[^0-9]/g, ''), 10));

    expect(prices.length).toBeGreaterThan(1);
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);
    }
  });

  // TEST 7: Sort by price high-to-low
  test('TEST 7: Sort by price high-to-low orders product cards in descending price order', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByTestId('product-card').first()).toBeVisible();

    const sortSelect = page.getByTestId('sort-products');
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/products') && res.url().includes('sort=price_desc') && res.status() === 200),
      sortSelect.selectOption('price_desc'),
    ]);
    expect(response.status()).toBe(200);

    await expect(page).toHaveURL(/sort=price_desc/);
    await expect(page.getByTestId('product-card').first()).toBeVisible();

    const priceElements = await page.getByTestId('product-price').allTextContents();
    const prices = priceElements.map((p) => parseInt(p.replace(/[^0-9]/g, ''), 10));

    expect(prices.length).toBeGreaterThan(1);
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i + 1]);
    }
  });

  // TEST 8: Pagination navigation
  test('TEST 8: Pagination buttons navigate across pages', async ({ page }) => {
    await page.goto('/products');

    const nextBtn = page.getByTestId('pagination-next');
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await expect(page).toHaveURL(/page=2/);
      await expect(page.getByText(/page 2 of/i)).toBeVisible();

      const prevBtn = page.getByTestId('pagination-previous');
      await prevBtn.click();
      await expect(page.getByText(/page 1 of/i)).toBeVisible();
    }
  });

  // TEST 9: View Details flow
  test('TEST 9: Clicking "View Details" navigates to product details page with complete specifications', async ({ page }) => {
    await page.goto('/products');

    const firstCard = page.getByTestId('product-card').first();
    const cardTitle = await firstCard.getByTestId('product-name').textContent();

    await firstCard.getByTestId('product-details-button').click();

    await expect(page).toHaveURL(/\/products\/[a-zA-Z0-9-]+/);
    await expect(page.getByTestId('product-details-page')).toBeVisible();

    const showcaseHeading = await page.getByTestId('showcase-name').textContent();
    expect(showcaseHeading?.trim()).toBe(cardTitle?.trim());

    await expect(page.getByTestId('showcase-price')).toBeVisible();
    await expect(page.locator('.showcase-img')).toBeVisible();
    await expect(page.locator('.showcase-description')).toBeVisible();
    await expect(page.locator('.specs-table')).toBeVisible();
    await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible();
  });

  // TEST 10: Direct navigation to valid product URL
  test('TEST 10: Direct navigation to a valid product URL loads details and breadcrumbs', async ({ page, request }) => {
    // Fetch product id from API
    const res = await request.get('http://localhost:5000/api/products?limit=1');
    const body = await res.json();
    const sampleProduct = body.data.products[0];

    await page.goto(`/products/${sampleProduct.id}`);

    await expect(page.getByTestId('product-details-page')).toBeVisible();
    await expect(page.getByTestId('showcase-name')).toContainText(sampleProduct.name);
    await expect(page.locator('.breadcrumbs-nav')).toBeVisible();
  });

  // TEST 11: Direct navigation to non-existent product URL shows 404 state
  test('TEST 11: Direct navigation to non-existent product ID displays error / not found page', async ({ page }) => {
    await page.goto('/products/00000000-0000-0000-0000-000000000000');

    await expect(page.getByTestId('product-error')).toBeVisible();
    await expect(page.getByRole('heading', { name: /product not found/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to smartphone catalog/i })).toBeVisible();
  });

  // TEST 12: Clear Filters restores complete catalog
  test('TEST 12: Clicking "Clear Filters" restores default unfiltered catalog', async ({ page }) => {
    await page.goto('/products?search=xyz-nothing&category=apple');

    await expect(page.getByTestId('product-empty')).toBeVisible();

    await page.getByRole('button', { name: /clear filters/i }).click();

    await expect(page).toHaveURL('/products');
    await expect(page.getByTestId('product-grid')).toBeVisible();
    const cardCount = await page.getByTestId('product-card').count();
    expect(cardCount).toBeGreaterThan(0);
  });
});
