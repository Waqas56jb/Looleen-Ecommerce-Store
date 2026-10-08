import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORE_CONFIG } from '@/config/store'

interface WishlistState {
  ids: string[]
  has: (productId: string) => boolean
  /** Returns true when the product is now in the wishlist */
  toggle: (productId: string) => boolean
  remove: (productId: string) => void
  clear: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      has: (id) => get().ids.includes(id),
      toggle: (id) => {
        const exists = get().ids.includes(id)
        set({ ids: exists ? get().ids.filter((x) => x !== id) : [id, ...get().ids] })
        return !exists
      },
      remove: (id) => set({ ids: get().ids.filter((x) => x !== id) }),
      clear: () => set({ ids: [] }),
    }),
    { name: `${STORE_CONFIG.storagePrefix}wishlist`, storage: createJSONStorage(() => localStorage) },
  ),
)

interface RecentState {
  ids: string[]
  push: (productId: string) => void
}

/** Recently viewed products (max 8, newest first) */
export const useRecentlyViewedStore = create<RecentState>()(
  persist(
    (set, get) => ({
      ids: [],
      push: (id) => set({ ids: [id, ...get().ids.filter((x) => x !== id)].slice(0, 8) }),
    }),
    { name: `${STORE_CONFIG.storagePrefix}recently_viewed`, storage: createJSONStorage(() => localStorage) },
  ),
)
