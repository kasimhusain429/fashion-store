"use client";

import { useSyncExternalStore } from "react";
import { getProduct } from "./catalog";

export type Currency = "EUR" | "USD";

export interface CartLine {
  slug: string;
  colorway: string;
  size: string;
  qty: number;
}

interface ShopState {
  lines: CartLine[];
  wishlist: string[];
  currency: Currency;
  cartOpen: boolean;
  /** Last line added, used to confirm the action in the bag. */
  lastAdded: string | null;
  hydrated: boolean;
}

const KEY = "vaelis:shop:v1";
export const MAX_QTY = 5;

const serverState: ShopState = {
  lines: [],
  wishlist: [],
  currency: "EUR",
  cartOpen: false,
  lastAdded: null,
  hydrated: false,
};

let state: ShopState = serverState;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ lines: state.lines, wishlist: state.wishlist, currency: state.currency }),
    );
  } catch {
    /* storage unavailable (private mode) — the bag still works for this visit */
  }
}

function set(patch: Partial<ShopState>, save = true) {
  state = { ...state, ...patch };
  if (save) persist();
  emit();
}

function hydrate() {
  if (state.hydrated || typeof window === "undefined") return;
  let saved: Partial<ShopState> = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    saved = {};
  }
  const lines = Array.isArray(saved.lines)
    ? saved.lines.filter((l) => {
        const p = getProduct(l.slug);
        return p && p.sizes.includes(l.size) && p.colorways.some((c) => c.id === l.colorway);
      })
    : [];
  state = {
    ...state,
    lines: lines.map((l) => ({ ...l, qty: Math.min(Math.max(1, Math.floor(l.qty) || 1), MAX_QTY) })),
    wishlist: Array.isArray(saved.wishlist) ? saved.wishlist.filter((s) => !!getProduct(s)) : [],
    currency: saved.currency === "USD" ? "USD" : "EUR",
    hydrated: true,
  };
  emit();
}

export const lineKey = (l: Pick<CartLine, "slug" | "colorway" | "size">) => `${l.slug}|${l.colorway}|${l.size}`;

export const shop = {
  add(line: Omit<CartLine, "qty">, qty = 1) {
    const key = lineKey(line);
    const existing = state.lines.find((l) => lineKey(l) === key);
    const lines = existing
      ? state.lines.map((l) => (lineKey(l) === key ? { ...l, qty: Math.min(l.qty + qty, MAX_QTY) } : l))
      : [...state.lines, { ...line, qty: Math.min(qty, MAX_QTY) }];
    set({ lines, cartOpen: true, lastAdded: key });
  },
  setQty(key: string, qty: number) {
    if (qty <= 0) return shop.remove(key);
    set({ lines: state.lines.map((l) => (lineKey(l) === key ? { ...l, qty: Math.min(qty, MAX_QTY) } : l)) });
  },
  remove(key: string) {
    set({ lines: state.lines.filter((l) => lineKey(l) !== key), lastAdded: null });
  },
  clear() {
    set({ lines: [], lastAdded: null });
  },
  toggleWish(slug: string) {
    const has = state.wishlist.includes(slug);
    set({ wishlist: has ? state.wishlist.filter((s) => s !== slug) : [...state.wishlist, slug] });
  },
  setCurrency(currency: Currency) {
    set({ currency });
  },
  openCart() {
    set({ cartOpen: true }, false);
  },
  closeCart() {
    set({ cartOpen: false, lastAdded: null }, false);
  },
};

function subscribe(l: () => void) {
  listeners.add(l);
  hydrate();
  return () => listeners.delete(l);
}

export function useShop() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverState,
  );
}

export function unitPrice(slug: string, currency: Currency) {
  const p = getProduct(slug);
  if (!p) return 0;
  return currency === "EUR" ? p.priceEUR : p.priceUSD;
}

export function cartCount(s: ShopState) {
  return s.lines.reduce((n, l) => n + l.qty, 0);
}

export function cartSubtotal(s: ShopState) {
  return s.lines.reduce((sum, l) => sum + unitPrice(l.slug, s.currency) * l.qty, 0);
}
