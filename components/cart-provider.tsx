"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  variant?: string;
  image?: string;
  source?: string;
  stock?: number;
};

type CartContextType = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, variant?: string, delta?: number) => void;
  removeItem: (productId: string, variant?: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_KEY = "shop_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem(CART_KEY);
      if (stored) {
        try {
          // Loading asynchronously avoids a synchronous state update during effect execution.
          setItems(JSON.parse(stored) as CartItem[]);
        } catch {
          window.localStorage.removeItem(CART_KEY);
        }
      }
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    }
  }, [items, hydrated]);

  const addItem = (item: CartItem) => {
    setItems((current) => {
      const key = `${item.productId}-${item.variant ?? "default"}`;
      const existing = current.find((entry) => `${entry.productId}-${entry.variant ?? "default"}` === key);

      if (existing) {
        return current.map((entry) =>
          `${entry.productId}-${entry.variant ?? "default"}` === key
            ? { ...entry, quantity: Math.min(entry.stock ?? Number.MAX_SAFE_INTEGER, entry.quantity + item.quantity), stock: item.stock ?? entry.stock }
            : entry,
        );
      }

      return [...current, { ...item, quantity: Math.min(item.stock ?? Number.MAX_SAFE_INTEGER, item.quantity) }];
    });
  };

  const updateQuantity = (productId: string, variant?: string, delta = 0) => {
    setItems((current) =>
      current
        .map((entry) => {
          const same = entry.productId === productId && (entry.variant ?? "default") === (variant ?? "default");
          if (!same) return entry;
          return { ...entry, quantity: Math.min(entry.stock ?? Number.MAX_SAFE_INTEGER, Math.max(1, entry.quantity + delta)) };
        })
        .filter((entry) => entry.quantity > 0),
    );
  };

  const removeItem = (productId: string, variant?: string) => {
    setItems((current) =>
      current.filter(
        (entry) => !(entry.productId === productId && (entry.variant ?? "default") === (variant ?? "default")),
      ),
    );
  };

  const clear = () => setItems([]);

  const count = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  );

  return (
    <CartContext.Provider value={{ items, count, subtotal, addItem, updateQuantity, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
