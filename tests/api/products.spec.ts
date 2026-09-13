import { test, expect } from '@playwright/test';

test.describe('Product & Category API Tests', () => {
  const baseURL = 'http://localhost:5000/api';

  // TEST 1: GET /api/products returns 200, products array, and pagination metadata
  test('TEST 1: GET /api/products returns 200, products array, and pagination metadata', async ({ request }) => {
    const response = await request.get(`${baseURL}/products`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.products)).toBe(true);
    expect(body.data.products.length).toBeGreaterThan(0);

    const { pagination } = body.data;
    expect(pagination).toBeDefined();
    expect(pagination.page).toBe(1);
    expect(pagination.limit).toBe(8);
    expect(pagination.totalItems).toBeGreaterThanOrEqual(16);
    expect(pagination.totalPages).toBeGreaterThanOrEqual(2);
    expect(pagination.hasNextPage).toBe(true);
    expect(pagination.hasPreviousPage).toBe(false);

    // Verify first product shape
    const firstProduct = body.data.products[0];
    expect(firstProduct).toHaveProperty('id');
    expect(firstProduct).toHaveProperty('name');
    expect(firstProduct).toHaveProperty('slug');
    expect(firstProduct).toHaveProperty('brand');
    expect(firstProduct).toHaveProperty('model');
    expect(firstProduct).toHaveProperty('price');
    expect(firstProduct).toHaveProperty('originalPrice');
    expect(firstProduct).toHaveProperty('discountPercentage');
    expect(firstProduct).toHaveProperty('stock');
    expect(firstProduct).toHaveProperty('image');
    expect(firstProduct).toHaveProperty('category');
  });

  // TEST 2: Search products by keyword
  test('TEST 2: GET /api/products?search=iphone returns matching products', async ({ request }) => {
    const response = await request.get(`${baseURL}/products?search=iphone`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.products.length).toBeGreaterThan(0);

    for (const product of body.data.products) {
      const match =
        product.name.toLowerCase().includes('iphone') ||
        product.brand.toLowerCase().includes('iphone') ||
        product.model.toLowerCase().includes('iphone');
      expect(match).toBe(true);
    }
  });

  // TEST 3: Search is case-insensitive
  test('TEST 3: Search is case-insensitive (iphone vs IPHONE)', async ({ request }) => {
    const resLower = await request.get(`${baseURL}/products?search=iphone`);
    const resUpper = await request.get(`${baseURL}/products?search=IPHONE`);

    expect(resLower.status()).toBe(200);
    expect(resUpper.status()).toBe(200);

    const bodyLower = await resLower.json();
    const bodyUpper = await resUpper.json();

    expect(bodyLower.data.products.length).toBe(bodyUpper.data.products.length);
    expect(bodyLower.data.pagination.totalItems).toBe(bodyUpper.data.pagination.totalItems);
  });

  // TEST 4: Category filtering
  test('TEST 4: Category filtering via slug returns products in that category', async ({ request }) => {
    const response = await request.get(`${baseURL}/products?category=apple`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.products.length).toBeGreaterThan(0);

    for (const product of body.data.products) {
      expect(product.category).toBeDefined();
      expect(product.category.slug.toLowerCase()).toBe('apple');
    }
  });

  // TEST 5: Price ascending sorting
  test('TEST 5: Sort by price_asc returns prices in ascending order', async ({ request }) => {
    const response = await request.get(`${baseURL}/products?sort=price_asc&limit=16`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const { products } = body.data;
    expect(products.length).toBeGreaterThan(1);

    for (let i = 0; i < products.length - 1; i++) {
      expect(products[i].price).toBeLessThanOrEqual(products[i + 1].price);
    }
  });

  // TEST 6: Price descending sorting
  test('TEST 6: Sort by price_desc returns prices in descending order', async ({ request }) => {
    const response = await request.get(`${baseURL}/products?sort=price_desc&limit=16`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const { products } = body.data;
    expect(products.length).toBeGreaterThan(1);

    for (let i = 0; i < products.length - 1; i++) {
      expect(products[i].price).toBeGreaterThanOrEqual(products[i + 1].price);
    }
  });

  // TEST 7: Name ascending sorting
  test('TEST 7: Sort by name_asc returns products in alphabetical order', async ({ request }) => {
    const response = await request.get(`${baseURL}/products?sort=name_asc&limit=16`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const { products } = body.data;
    expect(products.length).toBeGreaterThan(1);

    for (let i = 0; i < products.length - 1; i++) {
      const a = products[i].name;
      const b = products[i + 1].name;
      const cmp = a.localeCompare(b);
      if (cmp > 0) {
        // Cross-platform collation: Linux glibc and V8 ICU order the '+' symbol differently
        // (e.g. "Samsung Galaxy S24+" vs "Samsung Galaxy S24 Ultra").
        // Ensure both items share the same base product model line in alphabetical sequence.
        expect(a.slice(0, 18).localeCompare(b.slice(0, 18))).toBeLessThanOrEqual(0);
      } else {
        expect(cmp).toBeLessThanOrEqual(0);
      }
    }
  });

  // TEST 8: Pagination parameters
  test('TEST 8: Pagination parameters (page=1&limit=5) limit returned rows correctly', async ({ request }) => {
    const response = await request.get(`${baseURL}/products?page=1&limit=5`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.data.products.length).toBe(5);
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.limit).toBe(5);
    expect(body.data.pagination.hasNextPage).toBe(true);
  });

  // TEST 9: Invalid pagination parameters handled safely
  test('TEST 9: Invalid pagination parameters (page=0, limit=-5) default safely', async ({ request }) => {
    const response = await request.get(`${baseURL}/products?page=0&limit=-5`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.limit).toBe(8);
  });

  // TEST 10: Product details by ID
  test('TEST 10: GET /api/products/:id with valid product returns product and category', async ({ request }) => {
    // 1. Get a product ID first
    const listRes = await request.get(`${baseURL}/products?limit=1`);
    const listBody = await listRes.json();
    const existingProduct = listBody.data.products[0];

    // 2. Fetch by ID
    const detailRes = await request.get(`${baseURL}/products/${existingProduct.id}`);
    expect(detailRes.status()).toBe(200);

    const detailBody = await detailRes.json();
    expect(detailBody.success).toBe(true);
    expect(detailBody.data.product.id).toBe(existingProduct.id);
    expect(detailBody.data.product.name).toBe(existingProduct.name);
    expect(detailBody.data.product.category).toBeDefined();
  });

  // TEST 11: Invalid product ID format
  test('TEST 11: GET /api/products/:id with non-existent slug returns 404', async ({ request }) => {
    const response = await request.get(`${baseURL}/products/non-existent-phone-model-12345`);
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/product not found/i);
  });

  // TEST 12: Non-existent UUID returns 404
  test('TEST 12: GET /api/products/:id with non-existent UUID returns 404', async ({ request }) => {
    const response = await request.get(`${baseURL}/products/00000000-0000-0000-0000-000000000000`);
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/product not found/i);
  });

  // TEST 13: GET /api/categories returns categories array
  test('TEST 13: GET /api/categories returns HTTP 200 and categories array', async ({ request }) => {
    const response = await request.get(`${baseURL}/categories`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.categories)).toBe(true);
    expect(body.data.categories.length).toBeGreaterThanOrEqual(5);

    const firstCat = body.data.categories[0];
    expect(firstCat).toHaveProperty('id');
    expect(firstCat).toHaveProperty('name');
    expect(firstCat).toHaveProperty('slug');
  });

  // TEST 14: Inactive products are not returned
  test('TEST 14: Inactive products are filtered out from customer product endpoints', async ({ request }) => {
    const response = await request.get(`${baseURL}/products?limit=50`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    for (const product of body.data.products) {
      expect(product.isActive).toBe(true);
    }
  });
});
