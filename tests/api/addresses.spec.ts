import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

test.describe('Address API Tests (Step 7)', () => {
  test.describe.configure({ mode: 'serial' });

  let customer1Token: string;
  let customer2Token: string;

  const customer1 = {
    email: 'john.doe@example.com',
    password: 'Customer@123',
  };

  const customer2 = {
    email: 'jane.smith@example.com',
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

  test.beforeAll(async ({ request }) => {
    const res1 = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer1 });
    expect(res1.status()).toBe(200);
    const body1 = await res1.json();
    customer1Token = body1.data.token;

    const res2 = await request.post(`${API_BASE_URL}/api/auth/login`, { data: customer2 });
    expect(res2.status()).toBe(200);
    const body2 = await res2.json();
    customer2Token = body2.data.token;
  });

  // Helper to clear addresses for a user
  const clearAddresses = async (request: any, token: string) => {
    const res = await request.get(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status() === 200) {
      const body = await res.json();
      const addrs = body.data.addresses || [];
      for (const addr of addrs) {
        await request.delete(`${API_BASE_URL}/api/addresses/${addr.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }
  };

  test.beforeEach(async ({ request }) => {
    await clearAddresses(request, customer1Token);
    await clearAddresses(request, customer2Token);
  });

  // TEST 1: Unauthenticated address list rejected
  test('TEST 1: Unauthenticated GET /api/addresses is rejected with 401', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/addresses`);
    expect(res.status()).toBe(401);
  });

  // TEST 2: Authenticated user can fetch empty address list
  test('TEST 2: Authenticated user can fetch empty address list', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.addresses).toEqual([]);
  });

  // TEST 3: Create address validates mandatory fields
  test('TEST 3: Create address rejects missing required fields with 400', async ({ request }) => {
    const res = await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        fullName: '',
        phone: '123',
      },
    });
    expect(res.status()).toBe(400);
  });

  // TEST 4: Create address validates 10-digit phone number
  test('TEST 4: Create address rejects invalid phone format with 400', async ({ request }) => {
    const res = await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        ...sampleAddress,
        phone: '12345',
      },
    });
    expect(res.status()).toBe(400);
  });

  // TEST 5: Create address validates 6-digit PIN code
  test('TEST 5: Create address rejects invalid postal code with 400', async ({ request }) => {
    const res = await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        ...sampleAddress,
        postalCode: '0000',
      },
    });
    expect(res.status()).toBe(400);
  });

  // TEST 6: First created address is automatically set as default
  test('TEST 6: First created address is automatically set as default', async ({ request }) => {
    const res = await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        ...sampleAddress,
        isDefault: false, // Even if requested false, first address becomes default
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.address.isDefault).toBe(true);
  });

  // TEST 7: Second address created without isDefault remains non-default
  test('TEST 7: Second address created without isDefault remains non-default', async ({ request }) => {
    // 1. Create first address
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: sampleAddress,
    });

    // 2. Create second address
    const res2 = await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        ...sampleAddress,
        addressLine1: '808 Marine Drive',
        isDefault: false,
      },
    });
    expect(res2.status()).toBe(201);
    const body2 = await res2.json();
    expect(body2.data.address.isDefault).toBe(false);

    // Verify list has 1 default and 1 non-default
    const listRes = await request.get(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const listBody = await listRes.json();
    expect(listBody.data.addresses.length).toBe(2);
    expect(listBody.data.addresses.filter((a: any) => a.isDefault).length).toBe(1);
  });

  // TEST 8: Creating a new address with isDefault: true unsets previous default
  test('TEST 8: Creating a new address with isDefault: true unsets previous default', async ({ request }) => {
    const res1 = await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: sampleAddress,
    });
    const addr1 = (await res1.json()).data.address;

    const res2 = await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        ...sampleAddress,
        addressLine1: '909 Palm Beach Road',
        isDefault: true,
      },
    });
    expect(res2.status()).toBe(201);
    const addr2 = (await res2.json()).data.address;
    expect(addr2.isDefault).toBe(true);

    // Verify addr1 is no longer default
    const listRes = await request.get(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const list = (await listRes.json()).data.addresses;
    const freshAddr1 = list.find((a: any) => a.id === addr1.id);
    expect(freshAddr1.isDefault).toBe(false);
  });

  // TEST 9: Update address updates fields and validates ownership
  test('TEST 9: Update address updates fields correctly', async ({ request }) => {
    const res1 = await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: sampleAddress,
    });
    const addr = (await res1.json()).data.address;

    const updateRes = await request.put(`${API_BASE_URL}/api/addresses/${addr.id}`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: {
        city: 'Pune',
        postalCode: '411001',
      },
    });
    expect(updateRes.status()).toBe(200);
    const updated = (await updateRes.json()).data.address;
    expect(updated.city).toBe('Pune');
    expect(updated.postalCode).toBe('411001');
  });

  // TEST 10: Explicitly setting address as default via PATCH /api/addresses/:id/default
  test('TEST 10: Setting default address via PATCH /api/addresses/:id/default works', async ({ request }) => {
    const res1 = await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { ...sampleAddress, addressLine1: 'Addr 1' },
    });
    const addr1 = (await res1.json()).data.address;

    const res2 = await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { ...sampleAddress, addressLine1: 'Addr 2', isDefault: false },
    });
    const addr2 = (await res2.json()).data.address;

    const patchRes = await request.patch(`${API_BASE_URL}/api/addresses/${addr2.id}/default`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect(patchRes.status()).toBe(200);
    expect((await patchRes.json()).data.address.isDefault).toBe(true);

    // Verify addr1 is now false
    const listRes = await request.get(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const list = (await listRes.json()).data.addresses;
    expect(list.find((a: any) => a.id === addr1.id).isDefault).toBe(false);
    expect(list.find((a: any) => a.id === addr2.id).isDefault).toBe(true);
  });

  // TEST 11: Deleting a non-default address removes it
  test('TEST 11: Deleting a non-default address removes it from list', async ({ request }) => {
    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { ...sampleAddress, addressLine1: 'Default One' },
    });
    const res2 = await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { ...sampleAddress, addressLine1: 'Secondary One', isDefault: false },
    });
    const addr2 = (await res2.json()).data.address;

    const delRes = await request.delete(`${API_BASE_URL}/api/addresses/${addr2.id}`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect(delRes.status()).toBe(200);

    const listRes = await request.get(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const list = (await listRes.json()).data.addresses;
    expect(list.length).toBe(1);
    expect(list[0].addressLine1).toBe('Default One');
  });

  // TEST 12: Deleting default address designates another remaining address as default
  test('TEST 12: Deleting default address automatically designates another address as default', async ({ request }) => {
    const res1 = await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { ...sampleAddress, addressLine1: 'First One (Default)' },
    });
    const addr1 = (await res1.json()).data.address;

    await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { ...sampleAddress, addressLine1: 'Second One', isDefault: false },
    });

    // Delete default addr1
    const delRes = await request.delete(`${API_BASE_URL}/api/addresses/${addr1.id}`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect(delRes.status()).toBe(200);

    const listRes = await request.get(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const list = (await listRes.json()).data.addresses;
    expect(list.length).toBe(1);
    expect(list[0].isDefault).toBe(true);
  });

  // TEST 13: Strict user isolation
  test('TEST 13: User 1 cannot view, update, delete, or set default on User 2 address', async ({ request }) => {
    // User 2 creates an address
    const res2 = await request.post(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
      data: { ...sampleAddress, fullName: 'Jane Smith' },
    });
    const user2Addr = (await res2.json()).data.address;

    // User 1 lists addresses -> should not see User 2's address
    const listRes1 = await request.get(`${API_BASE_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const list1 = (await listRes1.json()).data.addresses;
    expect(list1.find((a: any) => a.id === user2Addr.id)).toBeUndefined();

    // User 1 tries to update User 2's address -> 404
    const updateRes = await request.put(`${API_BASE_URL}/api/addresses/${user2Addr.id}`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { fullName: 'Hacker Name' },
    });
    expect(updateRes.status()).toBe(404);

    // User 1 tries to set default on User 2's address -> 404
    const patchRes = await request.patch(`${API_BASE_URL}/api/addresses/${user2Addr.id}/default`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect(patchRes.status()).toBe(404);

    // User 1 tries to delete User 2's address -> 404
    const delRes = await request.delete(`${API_BASE_URL}/api/addresses/${user2Addr.id}`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect(delRes.status()).toBe(404);
  });

  // TEST 14: Non-existent address operations return 404
  test('TEST 14: Non-existent address operations return 404', async ({ request }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const updateRes = await request.put(`${API_BASE_URL}/api/addresses/${fakeId}`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
      data: { city: 'Pune' },
    });
    expect(updateRes.status()).toBe(404);

    const delRes = await request.delete(`${API_BASE_URL}/api/addresses/${fakeId}`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    expect(delRes.status()).toBe(404);
  });
});
