import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
}

interface WishlistStore {
  items: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggleWishlist: (item) => {
        const current = get().items;
        const exists = current.some((i) => i.productId === item.productId);
        if (exists) {
          set({ items: current.filter((i) => i.productId !== item.productId) });
        } else {
          set({ items: [...current, item] });
        }
      },
      isInWishlist: (productId) => {
        return get().items.some((i) => i.productId === productId);
      },
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'royal-step-wishlist',
    }
  )
);