"use client";

import { useState, useEffect } from "react";
import { CartItem, Currency } from "@/types/cart";

// Initial seed cart item (The Monolith Trench)
export const INITIAL_HERO_ITEM: CartItem = {
  id: "vaelis-look-01-trench",
  name: "The Monolith Cocoon Trench",
  look: "THE MONOLITH",
  priceEUR: 2850,
  priceUSD: 3100,
  size: "II (M)",
  colorway: "Obsidian Black",
  image: "/assets/s1_hero_trench_ref.jpg",
  quantity: 1,
};

let listeners: (() => void)[] = [];

let cartState = {
  isOpen: false,
  items: [INITIAL_HERO_ITEM] as CartItem[],
  currency: "EUR" as Currency,
  soundEnabled: false,
};

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export const cartStore = {
  getSnapshot() {
    return cartState;
  },
  subscribe(listener: () => void) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  openCart() {
    cartState = { ...cartState, isOpen: true };
    emitChange();
  },
  closeCart() {
    cartState = { ...cartState, isOpen: false };
    emitChange();
  },
  toggleCart() {
    cartState = { ...cartState, isOpen: !cartState.isOpen };
    emitChange();
  },
  setCurrency(curr: Currency) {
    cartState = { ...cartState, currency: curr };
    emitChange();
  },
  toggleSound() {
    cartState = { ...cartState, soundEnabled: !cartState.soundEnabled };
    emitChange();
  },
  addItem(item: CartItem) {
    const existingIndex = cartState.items.findIndex(
      (i) => i.id === item.id && i.size === item.size && i.colorway === item.colorway
    );
    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...cartState.items];
      updated[existingIndex].quantity += item.quantity;
    } else {
      updated = [...cartState.items, item];
    }
    cartState = { ...cartState, items: updated, isOpen: true };
    emitChange();
  },
  removeItem(id: string, size: string) {
    const updated = cartState.items.filter(
      (i) => !(i.id === id && i.size === size)
    );
    cartState = { ...cartState, items: updated };
    emitChange();
  },
};

export function useCart() {
  const [state, setState] = useState(cartStore.getSnapshot());

  useEffect(() => {
    return cartStore.subscribe(() => {
      setState(cartStore.getSnapshot());
    });
  }, []);

  return {
    ...state,
    totalCount: state.items.reduce((sum, item) => sum + item.quantity, 0),
    totalEUR: state.items.reduce(
      (sum, item) => sum + item.priceEUR * item.quantity,
      0
    ),
    totalUSD: state.items.reduce(
      (sum, item) => sum + item.priceUSD * item.quantity,
      0
    ),
    openCart: cartStore.openCart,
    closeCart: cartStore.closeCart,
    toggleCart: cartStore.toggleCart,
    setCurrency: cartStore.setCurrency,
    toggleSound: cartStore.toggleSound,
    addItem: cartStore.addItem,
    removeItem: cartStore.removeItem,
  };
}
