import { create } from "zustand";
import type { Item } from "./types";
type CartState = {
  cart: Item[];
  setCart: (value: Item[] | ((cart: Item[]) => Item[])) => void;
};
export const useCartStore = create<CartState>((set) => ({
  cart: [],
  setCart: (value) =>
    set((state) => ({
      cart: typeof value === "function" ? value(state.cart) : value,
    })),
}));
