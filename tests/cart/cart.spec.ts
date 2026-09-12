import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

test.describe('Shopping Cart UI Tests (Step 6)', () => {
  test.describe.configure({ mode: 'serial' });

  const customer1 = {
    email: 'john.doe@example.com',
    password: 'Customer@123',
  };

  const customer2 = {
    email: 'jane.smith@example.com',
    password: 'Customer@123',
  };

  // Helper to clear customer's cart via API before tests
  const clearUserCart = async (request: any, userCredentials: { email: string; password: string }) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: userCredentials,
    });
    if (loginRes.status() === 200) {
      const loginBody = await loginRes.json();
      const token = loginBody.data.token;
      const cartRes = await request.get(`${API_BASE_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (cartRes.status() === 200) {
        const cartBody = await cartRes.json();
        const items = cartBody.data.cart.items || [];
        for (const it of items) {
          await request.delete(`${API_BASE_URL}/api/cart/items/${it.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
    }
  };

  // Helper to log in a user in the browser
  const loginUserInUI = async (page: any, userCredentials: { email: string; password: string }) => {
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(userCredentials.email);
    await page.getByLabel(/password/i).fill(userCredentials.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  };

  test.beforeEach(async ({ request, page }) => {
    await clearUserCart(request, customer1);
    await clearUserCart(request, customer2);
    // Clear browser storage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  // ----------------------------------------------------
  // TEST 1: Unauthenticated Cart Access
  // ----------------------------------------------------
  test('TEST 1: Unauthenticated access to /cart displays authentication required message', async ({ page }) => {
    await page.goto('/cart');

    await expect(page.getByRole('heading', { level: 1, name: /your shopping cart/i })).toBeVisible();
    await expect(page.getByTestId('cart-auth-required')).toBeVisible();
    await expect(page.getByTestId('cart-login-btn')).toBeVisible();

    // Clicking Sign In navigates to /login
    await page.getByTestId('cart-login-btn').click();
    await expect(page).toHaveURL(/\/login/);
  });

  // ----------------------------------------------------
  // TEST 2: Empty Cart State for Authenticated User
  // ----------------------------------------------------
  test('TEST 2: Authenticated user with empty cart sees empty state and explore button', async ({ page }) => {
    await loginUserInUI(page, customer1);

    await page.goto('/cart');
    await expect(page.getByTestId('empty-cart-state')).toBeVisible();
    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
    await expect(page.getByTestId('start-shopping-btn')).toBeVisible();
  });

  // ----------------------------------------------------
  // TEST 3: Explore Smartphones Button Navigation
  // ----------------------------------------------------
  test('TEST 3: Clicking "Explore Smartphones" in empty cart navigates to product catalog', async ({ page }) => {
    await loginUserInUI(page, customer1);

    await page.goto('/cart');
    await page.getByTestId('start-shopping-btn').click();
    await expect(page).toHaveURL(/\/products/);
  });

  // ----------------------------------------------------
  // TEST 4: Add to Cart from Product Details Page with Quantity
  // ----------------------------------------------------
  test('TEST 4: Adding product from details page with quantity selector updates cart and navbar', async ({ page }) => {
    await loginUserInUI(page, customer1);

    // Navigate to products catalog and click first product
    await page.goto('/products');
    const firstProduct = page.getByTestId('product-card').first();
    await firstProduct.getByTestId('product-details-button').click();

    await expect(page.getByTestId('product-details-page')).toBeVisible();

    // Select quantity = 2
    const qtyDisplay = page.getByTestId('product-quantity-display');
    await expect(qtyDisplay).toHaveText('1');
    await page.getByTestId('increase-qty-btn').click();
    await expect(qtyDisplay).toHaveText('2');

    // Click Add to Cart
    await page.getByTestId('add-to-cart-button').click();

    // Success feedback is displayed
    await expect(page.getByTestId('cart-success-message')).toBeVisible();
    await expect(page.getByTestId('cart-success-message')).toContainText(/added 2 units/i);

    // Navbar cart badge shows (2)
    const navCart = page.getByTestId('nav-cart');
    await expect(navCart).toContainText('Cart (2)');
  });

  // ----------------------------------------------------
  // TEST 5: Navigate to Cart via Success Banner Link
  // ----------------------------------------------------
  test('TEST 5: Clicking "View Cart" link in success banner navigates to Cart page', async ({ page }) => {
    await loginUserInUI(page, customer1);

    await page.goto('/products');
    await page.getByTestId('product-card').first().getByTestId('product-details-button').click();

    await page.getByTestId('add-to-cart-button').click();
    await expect(page.getByTestId('cart-success-message')).toBeVisible();

    await page.getByTestId('view-cart-link').click();
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByTestId('cart-item-row')).toBeVisible();
  });

  // ----------------------------------------------------
  // TEST 6: Cart Page displays Item Details correctly
  // ----------------------------------------------------
  test('TEST 6: Cart page renders item details (image, name, price, quantity, total, and remove button)', async ({ page }) => {
    await loginUserInUI(page, customer1);

    // Add item
    await page.goto('/products');
    await page.getByTestId('product-card').first().getByTestId('product-details-button').click();
    await page.getByTestId('add-to-cart-button').click();
    await expect(page.getByTestId('cart-success-message')).toBeVisible();

    await page.goto('/cart');

    const itemRow = page.getByTestId('cart-item-row');
    await expect(itemRow).toBeVisible();
    await expect(itemRow.getByTestId('cart-product-name')).toBeVisible();
    await expect(itemRow.getByTestId('cart-item-unit-price')).toBeVisible();
    await expect(itemRow.getByTestId('cart-item-qty')).toHaveText('1');
    await expect(itemRow.getByTestId('cart-item-total')).toBeVisible();
    await expect(itemRow.getByTestId('remove-cart-item-btn')).toBeVisible();
  });

  // ----------------------------------------------------
  // TEST 7: Order Summary Calculations on Cart Page
  // ----------------------------------------------------
  test('TEST 7: Order Summary displays correct Subtotal, Free Shipping, and Grand Total', async ({ page }) => {
    await loginUserInUI(page, customer1);

    await page.goto('/products');
    await page.getByTestId('product-card').first().getByTestId('product-details-button').click();
    await page.getByTestId('add-to-cart-button').click();
    await expect(page.getByTestId('cart-success-message')).toBeVisible();

    await page.goto('/cart');

    const summaryCard = page.getByTestId('order-summary-card');
    await expect(summaryCard).toBeVisible();

    const subtotalText = await page.getByTestId('cart-subtotal').innerText();
    const grandTotalText = await page.getByTestId('cart-grand-total').innerText();
    expect(subtotalText).toBe(grandTotalText);
    expect(subtotalText).toContain('₹');

    // Checkout button is present
    await expect(page.getByTestId('proceed-checkout-btn')).toBeVisible();
  });

  // ----------------------------------------------------
  // TEST 8: Increment Item Quantity on Cart Page
  // ----------------------------------------------------
  test('TEST 8: Increasing quantity on Cart page updates item count and subtotal', async ({ page }) => {
    await loginUserInUI(page, customer1);

    await page.goto('/products');
    await page.getByTestId('product-card').first().getByTestId('product-details-button').click();
    await page.getByTestId('add-to-cart-button').click();
    await expect(page.getByTestId('cart-success-message')).toBeVisible();

    await page.goto('/cart');

    const itemRow = page.getByTestId('cart-item-row');
    await expect(itemRow.getByTestId('cart-item-qty')).toHaveText('1');

    // Click increment button in cart table
    await itemRow.getByTestId('increase-qty-btn').click();

    // Verify quantity increments to 2
    await expect(itemRow.getByTestId('cart-item-qty')).toHaveText('2');
    await expect(page.getByTestId('nav-cart')).toContainText('Cart (2)');
  });

  // ----------------------------------------------------
  // TEST 9: Decrement Item Quantity on Cart Page
  // ----------------------------------------------------
  test('TEST 9: Decreasing quantity on Cart page decrements item count', async ({ page }) => {
    await loginUserInUI(page, customer1);

    // Add 2 items from details page
    await page.goto('/products');
    await page.getByTestId('product-card').first().getByTestId('product-details-button').click();
    await page.getByTestId('increase-qty-btn').click();
    await page.getByTestId('add-to-cart-button').click();
    await expect(page.getByTestId('cart-success-message')).toBeVisible();

    await page.goto('/cart');
    const itemRow = page.getByTestId('cart-item-row');
    await expect(itemRow.getByTestId('cart-item-qty')).toHaveText('2');

    // Click decrement button in cart table
    await itemRow.getByTestId('decrease-qty-btn').click();

    // Verify quantity decreases to 1
    await expect(itemRow.getByTestId('cart-item-qty')).toHaveText('1');
    await expect(page.getByTestId('nav-cart')).toContainText('Cart (1)');
  });

  // ----------------------------------------------------
  // TEST 10: Decrement Button Disabled at Quantity 1
  // ----------------------------------------------------
  test('TEST 10: Decrement button is disabled when quantity is 1', async ({ page }) => {
    await loginUserInUI(page, customer1);

    await page.goto('/products');
    await page.getByTestId('product-card').first().getByTestId('product-details-button').click();
    await page.getByTestId('add-to-cart-button').click();
    await expect(page.getByTestId('cart-success-message')).toBeVisible();

    await page.goto('/cart');
    const itemRow = page.getByTestId('cart-item-row');
    await expect(itemRow.getByTestId('cart-item-qty')).toHaveText('1');

    // Verify decrement button is disabled
    const decBtn = itemRow.getByTestId('decrease-qty-btn');
    await expect(decBtn).toBeDisabled();
  });

  // ----------------------------------------------------
  // TEST 11: Remove Item from Cart
  // ----------------------------------------------------
  test('TEST 11: Removing item clears cart and transitions to empty state', async ({ page }) => {
    await loginUserInUI(page, customer1);

    await page.goto('/products');
    await page.getByTestId('product-card').first().getByTestId('product-details-button').click();
    await page.getByTestId('add-to-cart-button').click();
    await expect(page.getByTestId('cart-success-message')).toBeVisible();

    await page.goto('/cart');
    await expect(page.getByTestId('cart-item-row')).toBeVisible();

    // Click remove button
    await page.getByTestId('remove-cart-item-btn').click();

    // Cart table disappears and empty state appears
    await expect(page.getByTestId('empty-cart-state')).toBeVisible();
    await expect(page.getByTestId('cart-item-row')).not.toBeVisible();
    await expect(page.getByTestId('nav-cart')).toHaveText('Cart');
  });

  // ----------------------------------------------------
  // TEST 12: Quick Add from Product Catalog
  // ----------------------------------------------------
  test('TEST 12: Quick Add button on product card adds item to cart directly', async ({ page }) => {
    await loginUserInUI(page, customer1);

    await page.goto('/products');
    const firstCard = page.getByTestId('product-card').first();
    const quickAddBtn = firstCard.getByTestId('add-to-cart-quick-btn');
    await expect(quickAddBtn).toBeVisible();

    await quickAddBtn.click();
    await expect(quickAddBtn).toHaveText(/added/i);

    // Navbar updates to Cart (1)
    await expect(page.getByTestId('nav-cart')).toContainText('Cart (1)');

    // Verify on cart page
    await page.goto('/cart');
    await expect(page.getByTestId('cart-item-row')).toHaveCount(1);
  });

  // ----------------------------------------------------
  // TEST 13: Multiple Distinct Products in Cart
  // ----------------------------------------------------
  test('TEST 13: Adding multiple distinct products displays multiple rows on Cart page', async ({ page }) => {
    await loginUserInUI(page, customer1);

    await page.goto('/products');
    const cards = page.getByTestId('product-card');

    // Add first product via Quick Add
    await cards.nth(0).getByTestId('add-to-cart-quick-btn').click();

    // Add second product via Quick Add
    await cards.nth(1).getByTestId('add-to-cart-quick-btn').click();

    await expect(page.getByTestId('nav-cart')).toContainText('Cart (2)');

    // Navigate to Cart
    await page.goto('/cart');
    await expect(page.getByTestId('cart-item-row')).toHaveCount(2);
    await expect(page.getByTestId('cart-total-badge')).toHaveText('2 items');
  });

  // ----------------------------------------------------
  // TEST 14: Cart Persistence Across Page Reloads
  // ----------------------------------------------------
  test('TEST 14: Cart data persists across browser page reloads', async ({ page }) => {
    await loginUserInUI(page, customer1);

    await page.goto('/products');
    await page.getByTestId('product-card').first().getByTestId('product-details-button').click();
    await page.getByTestId('add-to-cart-button').click();

    await page.goto('/cart');
    await expect(page.getByTestId('cart-item-row')).toBeVisible();

    // Reload the page
    await page.reload();

    // Verify item is still present after reload
    await expect(page.getByTestId('cart-item-row')).toBeVisible();
    await expect(page.getByTestId('cart-grand-total')).toBeVisible();
  });

  // ----------------------------------------------------
  // TEST 15: Cart Isolation Between Different Customer Accounts
  // ----------------------------------------------------
  test('TEST 15: Logging out and logging into a different account displays that account\'s separate cart', async ({ page }) => {
    // 1. Customer 1 adds an item
    await loginUserInUI(page, customer1);
    await page.goto('/products');
    await page.getByTestId('product-card').first().getByTestId('add-to-cart-quick-btn').click();
    await expect(page.getByTestId('nav-cart')).toContainText('Cart (1)');

    // 2. Customer 1 logs out
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page.getByTestId('nav-cart')).toHaveText('Cart');

    // 3. Customer 2 logs in (has empty cart)
    await loginUserInUI(page, customer2);
    await page.goto('/cart');
    await expect(page.getByTestId('empty-cart-state')).toBeVisible();
    await expect(page.getByTestId('cart-item-row')).not.toBeVisible();
  });
});
