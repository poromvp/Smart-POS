"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export interface CartItem {
  id: string;
  itemId: string;
  name: string;
  basePrice: number;
  modifierTotal: number;
  toppings: string[];
  sweetness: string;
  note: string;
  quantity: number;
}

export interface CartItemInput {
  itemId: string;
  name: string;
  basePrice: number;
  modifierTotal: number;
  toppings: string[];
  sweetness: string;
  note: string;
}

const CART_STORAGE_KEY = "guest-cart-v1";

const createCartItemId = () =>
  `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const readCartItems = (): CartItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const rawValue = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!rawValue) return [];

    const parsedValue = JSON.parse(rawValue) as unknown;
    return Array.isArray(parsedValue) ? (parsedValue as CartItem[]) : [];
  } catch {
    return [];
  }
};

const writeCartItems = (items: CartItem[]) => {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
};

export function useGuestCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const hydrateTimer = window.setTimeout(() => {
      setCartItems(readCartItems());
      setIsReady(true);
    }, 0);

    return () => {
      window.clearTimeout(hydrateTimer);
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    writeCartItems(cartItems);
  }, [cartItems, isReady]);

  const addItem = useCallback((input: CartItemInput) => {
    setCartItems((currentItems) => [
      ...currentItems,
      {
        id: createCartItemId(),
        ...input,
        quantity: 1,
      },
    ]);
  }, []);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setCartItems((currentItems) =>
      currentItems
        .map((item) => {
          if (item.id !== itemId) return item;

          return {
            ...item,
            quantity: item.quantity + delta,
          };
        })
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const updateNote = useCallback((itemId: string, note: string) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, note } : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const totalQuantity = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  const totalPrice = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + (item.basePrice + item.modifierTotal) * item.quantity,
        0,
      ),
    [cartItems],
  );

  return {
    cartItems,
    addItem,
    clearCart,
    totalPrice,
    totalQuantity,
    updateNote,
    updateQuantity,
  };
}