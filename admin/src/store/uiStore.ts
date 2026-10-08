import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { STORE_CONFIG } from '@/config/store'
import type { Lang } from '@/types'

export function applyDocumentLang(lang: Lang) {
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

interface UIState {
  lang: Lang
  sidebarCollapsed: boolean
  mobileNavOpen: boolean
  commandOpen: boolean
  setLang: (l: Lang) => void
  toggleLang: () => void
  toggleSidebar: () => void
  setMobileNavOpen: (o: boolean) => void
  setCommandOpen: (o: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      lang: STORE_CONFIG.defaultLanguage,
      sidebarCollapsed: false,
      mobileNavOpen: false,
      commandOpen: false,
      setLang: (lang) => {
        applyDocumentLang(lang)
        set({ lang })
      },
      toggleLang: () => get().setLang(get().lang === 'en' ? 'ar' : 'en'),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
    }),
    {
      name: `${STORE_CONFIG.storagePrefix}ui`,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lang: s.lang, sidebarCollapsed: s.sidebarCollapsed }),
      onRehydrateStorage: () => (s) => applyDocumentLang(s?.lang ?? STORE_CONFIG.defaultLanguage),
    },
  ),
)
