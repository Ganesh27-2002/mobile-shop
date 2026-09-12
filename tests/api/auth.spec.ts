import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

test.describe('Authentication & Authorization API Tests', () => {
  const seededCustomer = {
    email: 'john.doe@example.com',
    password: 'Customer@123',
  };

  const seededAdmin = {
    email: 'admin@mobileshop.com',
    password: 'Admin@123',
  };

  // ----------------------------------------------------
  // TEST 1: Successful Signup
  // ----------------------------------------------------
  test('TEST 1: Successful signup creates user and returns safe user data (HTTP 201)', async ({ request }) => {
    const uniqueEmail = `test-user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}@example.com`;
    const signupData = {
      firstName: 'Alice',
      lastName: 'Wonderland',
      email: uniqueEmail,
      password: 'Password@123',
      phone: '9876543210',
    };

    const response = await request.post(`${API_BASE_URL}/api/auth/signup`, {
      data: signupData,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.message).toBe('User registered successfully');
    expect(body.data).toBeDefined();
    expect(body.data.user).toBeDefined();
    expect(body.data.user.id).toBeDefined();
    expect(body.data.user.firstName).toBe('Alice');
    expect(body.data.user.lastName).toBe('Wonderland');
    expect(body.data.user.email).toBe(uniqueEmail.toLowerCase());
    expect(body.data.user.role).toBe('CUSTOMER');
    expect(body.data.user.isActive).toBe(true);

    // Ensure password and password hash are NEVER exposed
    expect(body.data.user.password).toBeUndefined();
    expect(body.data.user.passwordHash).toBeUndefined();
    expect(body.data.user.password_hash).toBeUndefined();
  });

  // ----------------------------------------------------
  // TEST 2: Duplicate Signup
  // ----------------------------------------------------
  test('TEST 2: Duplicate signup with existing email is rejected (HTTP 409)', async ({ request }) => {
    const uniqueEmail = `dup-user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}@example.com`;
    const signupData = {
      firstName: 'Bob',
      lastName: 'Builder',
      email: uniqueEmail,
      password: 'Password@123',
      phone: '9876543210',
    };

    // First signup -> 201
    const firstRes = await request.post(`${API_BASE_URL}/api/auth/signup`, {
      data: signupData,
    });
    expect(firstRes.status()).toBe(201);

    // Second signup with same email -> 409 Conflict
    const secondRes = await request.post(`${API_BASE_URL}/api/auth/signup`, {
      data: signupData,
    });
    expect(secondRes.status()).toBe(409);
    const body = await secondRes.json();
    expect(body.success).toBe(false);
    expect(body.message).toContain('already registered');
  });

  // ----------------------------------------------------
  // TEST 3: Invalid Signup Email
  // ----------------------------------------------------
  test('TEST 3: Signup with invalid email format returns validation error (HTTP 400)', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/auth/signup`, {
      data: {
        firstName: 'Invalid',
        lastName: 'EmailUser',
        email: 'not-an-email',
        password: 'Password@123',
        phone: '9876543210',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.errors).toBeDefined();
    expect(body.errors.some((err: string) => /email/i.test(err))).toBe(true);
  });

  // ----------------------------------------------------
  // TEST 4: Weak Password Validation
  // ----------------------------------------------------
  test('TEST 4: Signup with short or weak password returns validation error (HTTP 400)', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/auth/signup`, {
      data: {
        firstName: 'Weak',
        lastName: 'PasswordUser',
        email: `weak-${Date.now()}@example.com`,
        password: '123', // Too short
        phone: '9876543210',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.errors).toBeDefined();
    expect(body.errors.some((err: string) => /password/i.test(err))).toBe(true);
  });

  // ----------------------------------------------------
  // TEST 5: Successful Login
  // ----------------------------------------------------
  test('TEST 5: Successful login with valid credentials returns JWT and safe user (HTTP 200)', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: seededCustomer,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.message).toBe('Login successful');
    expect(body.data).toBeDefined();
    expect(typeof body.data.token).toBe('string');
    expect(body.data.token.length).toBeGreaterThan(20);

    expect(body.data.user).toBeDefined();
    expect(body.data.user.email).toBe(seededCustomer.email);
    expect(body.data.user.role).toBe('CUSTOMER');
    expect(body.data.user.password).toBeUndefined();
  });

  // ----------------------------------------------------
  // TEST 6: Invalid Login Password
  // ----------------------------------------------------
  test('TEST 6: Login with incorrect password returns 401 Unauthorized', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: {
        email: seededCustomer.email,
        password: 'IncorrectPassword@999',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe('Invalid email or password');
    expect(body.data).toBeUndefined();
  });

  // ----------------------------------------------------
  // TEST 7: Invalid Login Email
  // ----------------------------------------------------
  test('TEST 7: Login with non-existent email returns generic 401 error', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: {
        email: `non-existent-${Date.now()}@example.com`,
        password: 'SomePassword@123',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe('Invalid email or password');
    expect(body.data).toBeUndefined();
  });

  // ----------------------------------------------------
  // TEST 8: GET /api/auth/me with Valid JWT
  // ----------------------------------------------------
  test('TEST 8: GET /api/auth/me with valid JWT returns current user profile (HTTP 200)', async ({ request }) => {
    // 1. Log in first to get token
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: seededCustomer,
    });
    const { data } = await loginRes.json();
    const token = data.token;

    // 2. Access /api/auth/me
    const meRes = await request.get(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(meRes.status()).toBe(200);
    const body = await meRes.json();
    expect(body.success).toBe(true);
    expect(body.data.user).toBeDefined();
    expect(body.data.user.email).toBe(seededCustomer.email);
    expect(body.data.user.password).toBeUndefined();
  });

  // ----------------------------------------------------
  // TEST 9: GET /api/auth/me without JWT
  // ----------------------------------------------------
  test('TEST 9: GET /api/auth/me without token returns 401 Unauthorized', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/auth/me`);
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toContain('Authentication required');
  });

  // ----------------------------------------------------
  // TEST 10: GET /api/auth/me with Invalid JWT
  // ----------------------------------------------------
  test('TEST 10: GET /api/auth/me with invalid or forged JWT returns 401 Unauthorized', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: 'Bearer invalid.forged.jwt.token.string',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toContain('Invalid');
  });

  // ----------------------------------------------------
  // TEST 11: Admin Route with CUSTOMER Token
  // ----------------------------------------------------
  test('TEST 11: CUSTOMER role attempting to access admin route is rejected (HTTP 403 Forbidden)', async ({ request }) => {
    // 1. Log in as Customer
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: seededCustomer,
    });
    const { data } = await loginRes.json();
    const customerToken = data.token;

    // 2. Call admin route
    const adminRes = await request.get(`${API_BASE_URL}/api/admin/test`, {
      headers: {
        Authorization: `Bearer ${customerToken}`,
      },
    });

    expect(adminRes.status()).toBe(403);
    const body = await adminRes.json();
    expect(body.success).toBe(false);
    expect(body.message).toContain('Admin');
  });

  // ----------------------------------------------------
  // TEST 12: Admin Route with ADMIN Token
  // ----------------------------------------------------
  test('TEST 12: ADMIN role accessing admin route is granted access (HTTP 200 OK)', async ({ request }) => {
    // 1. Log in as Admin
    const loginRes = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: seededAdmin,
    });
    const { data } = await loginRes.json();
    const adminToken = data.token;

    // 2. Call admin route
    const adminRes = await request.get(`${API_BASE_URL}/api/admin/test`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(adminRes.status()).toBe(200);
    const body = await adminRes.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('Admin access granted');
    expect(body.data.user.role).toBe('ADMIN');
  });

  // ----------------------------------------------------
  // TEST 13: Malformed Authorization Header Handling
  // ----------------------------------------------------
  test('TEST 13: Requests with malformed Authorization header return 401 Unauthorized', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
