import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORE_CONFIG } from '@/config/store'
import type { Lang } from '@/types'

interface UIState {
  lang: Lang
  cartOpen: boolean
  searchOpen: boolean
  mobileMenuOpen: boolean
  /** Slug of the product shown in the quick-view modal */
  quickViewSlug: string | null
  setLang: (lang: Lang) => void
  toggleLang: () => void
  setCartOpen: (open: boolean) => void
  setSearchOpen: (open: boolean) => void
  setMobileMenuOpen: (open: boolean) => void
  openQuickView: (slug: string) => void
  closeQuickView: () => void
}

export function applyDocumentLang(lang: Lang) {
  const html = document.documentElement
  html.lang = lang
  html.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      lang: STORE_CONFIG.defaultLanguage,
      cartOpen: false,
      searchOpen: false,
      mobileMenuOpen: false,
      quickViewSlug: null,
      setLang: (lang) => {
        applyDocumentLang(lang)
        set({ lang })
      },
      toggleLang: () => get().setLang(get().lang === 'en' ? 'ar' : 'en'),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
      openQuickView: (quickViewSlug) => set({ quickViewSlug }),
      closeQuickView: () => set({ quickViewSlug: null }),
    }),
    {
      name: `${STORE_CONFIG.storagePrefix}language`,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lang: s.lang }),
      onRehydrateStorage: () => (state) => applyDocumentLang(state?.lang ?? STORE_CONFIG.defaultLanguage),
    },
  ),
)
