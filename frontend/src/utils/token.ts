/**
 * Centralized client-side JWT access token manager.
 *
 * NOTE ON SECURITY:
 * Storing access tokens in localStorage is a standard and simplified approach for
 * client-side web applications and single-page architectures in this portfolio project.
 * In production banking or high-security applications, HttpOnly cookies with CSRF protection
 * or in-memory token storage with refresh token rotation may be preferred depending on the topology.
 * Passwords and sensitive secrets are NEVER stored on the client.
 */

const TOKEN_KEY = 'mobile_shop_token';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error('Failed to save JWT token to localStorage:', err);
  }
};

export const removeToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error('Failed to remove JWT token from localStorage:', err);
  }
};
