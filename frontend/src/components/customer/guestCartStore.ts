"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export interface CartItem {
  id: string;
  itemId: string;
  name: string;
  sizeName?: string;
  variantId?: number;
  modifierOptionIds?: number[];
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
  sizeName?: string;
  variantId?: number;
  modifierOptionIds?: number[];
  basePrice: number;
  modifierTotal: number;
  toppings?: string[];
  sweetness?: string;
  note: string;
}

const CART_STORAGE_KEY = "guest-cart-v1";

const createCartItemId = () =>
  `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const readCartItems = (storageKey: string): CartItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) return [];

    const parsedValue = JSON.parse(rawValue) as unknown;
    return Array.isArray(parsedValue) ? (parsedValue as CartItem[]) : [];
  } catch {
    return [];
  }
};

const writeCartItems = (storageKey: string, items: CartItem[]) => {
  window.localStorage.setItem(storageKey, JSON.stringify(items));
};

export function useGuestCart(tableId: string) {
  const storageKey = `${CART_STORAGE_KEY}:${tableId}`;
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);

  useEffect(() => {
    const hydrateTimer = window.setTimeout(() => {
      setCartItems(readCartItems(storageKey));
      setLoadedStorageKey(storageKey);
    }, 0);

    return () => {
      window.clearTimeout(hydrateTimer);
    };
  }, [storageKey]);

  useEffect(() => {
    if (loadedStorageKey !== storageKey) return;

    writeCartItems(storageKey, cartItems);
  }, [cartItems, loadedStorageKey, storageKey]);

  const addItem = useCallback((input: CartItemInput) => {
    setCartItems((currentItems) => [
      ...currentItems,
      {
        id: createCartItemId(),
        itemId: input.itemId,
        name: input.name,
        sizeName: input.sizeName,
        variantId: input.variantId,
        modifierOptionIds: input.modifierOptionIds || [],
        basePrice: input.basePrice,
        modifierTotal: input.modifierTotal,
        toppings: input.toppings || [],
        sweetness: input.sweetness || "",
        note: input.note,
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
        (sum, item) =>
          sum + (item.basePrice + (item.modifierTotal || 0)) * item.quantity,
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
