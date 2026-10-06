import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IMenu } from '@/types/menu';

export interface CartItem extends IMenu {
  itemCount: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: IMenu) => void;
  removeItem: (id: string) => void;
  incrementItem: (id: string) => void;
  decrementItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      
      addItem: (menuItem) => set((state) => {
        const existing = state.items.find(i => i._id === menuItem._id);
        if (existing) {
          return {
            items: state.items.map(i => 
              i._id === menuItem._id ? { ...i, itemCount: i.itemCount + 1 } : i
            )
          };
        }
        return { items: [...state.items, { ...menuItem, itemCount: 1 }] };
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => String(i._id) !== id)
      })),

      incrementItem: (id) => set((state) => ({
        items: state.items.map(i => 
          String(i._id) === id ? { ...i, itemCount: i.itemCount + 1 } : i
        )
      })),

      decrementItem: (id) => set((state) => {
        const existing = state.items.find(i => String(i._id) === id);
        if (existing && existing.itemCount > 1) {
          return {
            items: state.items.map(i => 
              String(i._id) === id ? { ...i, itemCount: i.itemCount - 1 } : i
            )
          };
        }
        return { items: state.items.filter(i => String(i._id) !== id) };
      }),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'restaurant-cart', // local storage key
    }
  )
);
