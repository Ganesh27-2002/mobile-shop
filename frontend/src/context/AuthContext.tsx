import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type {
  User,
  LoginRequest,
  SignupRequest,
  AuthContextType,
} from '../types/auth.js';
import { authService } from '../services/authService.js';
import { getToken, setToken as saveToken, removeToken } from '../utils/token.js';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session by verifying stored token with /api/auth/me
  const initializeAuth = useCallback(async () => {
    const storedToken = getToken();
    if (!storedToken) {
      setUser(null);
      setTokenState(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
      setTokenState(storedToken);
    } catch {
      // Token is invalid or expired
      removeToken();
      setUser(null);
      setTokenState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Login handler
  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    const data = await authService.login(credentials);
    saveToken(data.token);
    setTokenState(data.token);
    setUser(data.user);
  }, []);

  // Signup handler (Registration without auto-login)
  const signup = useCallback(async (data: SignupRequest): Promise<User> => {
    return await authService.signup(data);
  }, []);

  // Logout handler
  const logout = useCallback((): void => {
    removeToken();
    setTokenState(null);
    setUser(null);
  }, []);

  // Refresh user profile
  const refreshUser = useCallback(async (): Promise<void> => {
    if (!getToken()) return;
    try {
      const refreshedUser = await authService.getMe();
      setUser(refreshedUser);
    } catch {
      logout();
    }
  }, [logout]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      login,
      signup,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, login, signup, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
