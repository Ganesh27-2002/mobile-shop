import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

test.describe('Delivery Addresses UI Tests (Step 7)', () => {
  test.describe.configure({ mode: 'serial' });

  const customer1 = {
    email: 'john.doe@example.com',
    password: 'Customer@123',
  };

  const sampleAddress = {
    fullName: 'John Doe',
    phone: '9876543210',
    addressLine1: '402 Sunset Boulevard',
    addressLine2: 'Near Central Park',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
  };

  // Helper to clear addresses via API before tests
  const clearUserAddresses = async (request: any) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: customer1,
    });
    if (loginRes.status() === 200) {
      const token = (await loginRes.json()).data.token;
      const addrRes = await request.get(`${API_BASE_URL}/api/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (addrRes.status() === 200) {
        const addrs = (await addrRes.json()).data.addresses || [];
        for (const addr of addrs) {
          await request.delete(`${API_BASE_URL}/api/addresses/${addr.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
    }
  };

  const loginUser = async (page: any) => {
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(customer1.email);
    await page.getByLabel(/password/i).fill(customer1.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
  };

  test.beforeEach(async ({ request, page }) => {
    await clearUserAddresses(request);
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  // TEST 1: Unauthenticated access redirects to /login
  test('TEST 1: Unauthenticated access to /addresses redirects to /login', async ({ page }) => {
    await page.goto('/addresses');
    await expect(page).toHaveURL(/\/login/);
  });

  // TEST 2: Authenticated user sees empty addresses state
  test('TEST 2: Authenticated user with no addresses sees empty state', async ({ page }) => {
    await loginUser(page);
    await page.goto('/addresses');
    await expect(page.getByTestId('addresses-page')).toBeVisible();
    await expect(page.getByTestId('empty-addresses-state')).toBeVisible();
    await expect(page.getByText(/no saved addresses found/i)).toBeVisible();
  });

  // TEST 3: Clicking Add Address opens modal form
  test('TEST 3: Clicking "+ Add New Address" opens the address form modal', async ({ page }) => {
    await loginUser(page);
    await page.goto('/addresses');
    await page.getByTestId('add-address-btn').click();
    await expect(page.getByTestId('address-modal')).toBeVisible();
    await expect(page.getByTestId('input-full-name')).toBeVisible();
    await expect(page.getByTestId('input-phone')).toBeVisible();
    await expect(page.getByTestId('input-address-line1')).toBeVisible();
    await expect(page.getByTestId('input-city')).toBeVisible();
    await expect(page.getByTestId('input-state')).toBeVisible();
    await expect(page.getByTestId('input-postal-code')).toBeVisible();
  });

  // TEST 4: Address form validation errors
  test('TEST 4: Form displays validation errors when submitting invalid inputs', async ({ page }) => {
    await loginUser(page);
    await page.goto('/addresses');
    await page.getByTestId('add-address-btn').click();

    // Submit without filling
    await page.getByTestId('save-address-btn').click();
    await expect(page.getByTestId('error-full-name')).toBeVisible();
    await expect(page.getByTestId('error-phone')).toBeVisible();
    await expect(page.getByTestId('error-address-line1')).toBeVisible();
    await expect(page.getByTestId('error-city')).toBeVisible();
    await expect(page.getByTestId('error-postal-code')).toBeVisible();
  });

  // TEST 5: Creating an address displays card with Default badge
  test('TEST 5: Creating first address displays address card with Default badge', async ({ page }) => {
    await loginUser(page);
    await page.goto('/addresses');
    await page.getByTestId('add-address-btn').click();

    await page.getByTestId('input-full-name').fill('John Doe');
    await page.getByTestId('input-phone').fill('9876543210');
    await page.getByTestId('input-address-line1').fill('402 Sunset Boulevard');
    await page.getByTestId('input-city').fill('Mumbai');
    await page.getByTestId('input-state').fill('Maharashtra');
    await page.getByTestId('input-postal-code').fill('400001');

    await page.getByTestId('save-address-btn').click();

    await expect(page.getByTestId('address-modal')).not.toBeVisible();
    await expect(page.getByTestId('address-card').first()).toBeVisible();
    await expect(page.getByTestId('address-card').first().getByTestId('address-full-name')).toHaveText('John Doe');
    await expect(page.getByTestId('address-card').first().getByTestId('default-address-badge')).toBeVisible();
  });

  // TEST 6: Creating a second address allows setting default
  test('TEST 6: Setting second address as default updates badges', async ({ page, request }) => {
    // Seed first address
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: sampleAddress,
    });

    await loginUser(page);
    await page.goto('/addresses');
    await expect(page.getByTestId('address-card')).toHaveCount(1);

    // Add second address
    await page.getByTestId('add-address-btn').click();
    await page.getByTestId('input-full-name').fill('John Doe (Office)');
    await page.getByTestId('input-phone').fill('9876543210');
    await page.getByTestId('input-address-line1').fill('Tech Park Tower B');
    await page.getByTestId('input-city').fill('Bengaluru');
    await page.getByTestId('input-state').fill('Karnataka');
    await page.getByTestId('input-postal-code').fill('560001');
    await page.getByTestId('save-address-btn').click();

    await expect(page.getByTestId('address-card')).toHaveCount(2);

    // Click "Set as Default" on the second address
    const officeCard = page.getByTestId('address-card').filter({ hasText: 'John Doe (Office)' });
    await officeCard.getByTestId('set-default-btn').click();

    // Verify office card now has default badge
    await expect(page.getByTestId('address-card').filter({ hasText: 'John Doe (Office)' }).getByTestId('default-address-badge')).toBeVisible();
  });

  // TEST 7: Editing an existing address updates card details
  test('TEST 7: Editing an address updates the card details', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: sampleAddress,
    });

    await loginUser(page);
    await page.goto('/addresses');
    await expect(page.getByTestId('address-card')).toBeVisible();

    await page.getByTestId('edit-address-btn').click();
    await expect(page.getByTestId('address-modal')).toBeVisible();

    await page.getByTestId('input-city').fill('Navi Mumbai');
    await page.getByTestId('save-address-btn').click();

    await expect(page.getByTestId('address-modal')).not.toBeVisible();
    await expect(page.getByTestId('address-full-text')).toContainText('Navi Mumbai');
  });

  // TEST 8: Deleting an address removes it
  test('TEST 8: Deleting an address removes it from the list', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    const token = (await loginRes.json()).data.token;
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      data: sampleAddress,
    });

    // Accept confirmation dialog
    page.on('dialog', (dialog) => dialog.accept());

    await loginUser(page);
    await page.goto('/addresses');
    await expect(page.getByTestId('address-card')).toBeVisible();

    await page.getByTestId('delete-address-btn').click();
    await expect(page.getByTestId('empty-addresses-state')).toBeVisible();
  });

  // TEST 9: Navigation links in Navbar and Profile lead to Addresses
  test('TEST 9: Navigation link in Navbar leads to Addresses page', async ({ page }) => {
    await loginUser(page);
    await page.getByTestId('nav-addresses').click();
    await expect(page).toHaveURL('/addresses');
    await expect(page.getByTestId('addresses-page')).toBeVisible();

    // From profile page
    await page.goto('/profile');
    await page.getByTestId('profile-addresses-btn').click();
    await expect(page).toHaveURL('/addresses');
  });
});
