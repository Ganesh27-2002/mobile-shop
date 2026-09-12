import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Cart } from '../types/cart.js';
import { cartService } from '../services/cartService.js';
import { useAuth } from '../hooks/useAuth.js';

export interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  subtotal: number;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  clearCartState: () => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const clearCartState = useCallback(() => {
    setCart(null);
  }, []);

  const refreshCart = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    try {
      setIsLoading(true);
      const fetchedCart = await cartService.getCart();
      setCart(fetchedCart);
    } catch {
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthLoading) {
      if (isAuthenticated) {
        refreshCart();
      } else {
        clearCartState();
      }
    }
  }, [isAuthenticated, isAuthLoading, refreshCart, clearCartState]);

  const addToCart = useCallback(
    async (productId: string, quantity: number = 1): Promise<void> => {
      setIsLoading(true);
      try {
        const updatedCart = await cartService.addToCart(productId, quantity);
        setCart(updatedCart);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number): Promise<void> => {
      setIsLoading(true);
      try {
        const updatedCart = await cartService.updateCartItem(cartItemId, quantity);
        setCart(updatedCart);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const removeFromCart = useCallback(
    async (cartItemId: string): Promise<void> => {
      setIsLoading(true);
      try {
        const updatedCart = await cartService.removeCartItem(cartItemId);
        setCart(updatedCart);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const itemCount = cart ? cart.itemCount : 0;
  const subtotal = cart ? cart.subtotal : 0;

  const value = useMemo<CartContextType>(
    () => ({
      cart,
      isLoading,
      itemCount,
      subtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      refreshCart,
      clearCartState,
    }),
    [
      cart,
      isLoading,
      itemCount,
      subtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      refreshCart,
      clearCartState,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
