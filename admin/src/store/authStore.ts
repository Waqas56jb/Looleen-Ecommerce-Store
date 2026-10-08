import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { STORE_CONFIG } from '@/config/store'
import type { AdminUser } from '@/types'

/**
 * Admin session only. Credential checks live in services/authService.ts.
 * "Remember me" → localStorage; otherwise sessionStorage.
 */
interface AuthState {
  admin: AdminUser | null
  token: string | null
  remember: boolean
  setSession: (admin: AdminUser, token: string, remember: boolean) => void
  updateAdmin: (patch: Partial<AdminUser>) => void
  clear: () => void
}

const hybridStorage = {
  getItem: (k: string) => localStorage.getItem(k) ?? sessionStorage.getItem(k),
  setItem: (k: string, v: string) => {
    const remember = (JSON.parse(v) as { state?: { remember?: boolean } }).state?.remember
    if (remember) {
      localStorage.setItem(k, v)
      sessionStorage.removeItem(k)
    } else {
      sessionStorage.setItem(k, v)
      localStorage.removeItem(k)
    }
  },
  removeItem: (k: string) => {
    localStorage.removeItem(k)
    sessionStorage.removeItem(k)
  },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      token: null,
      remember: true,
      setSession: (admin, token, remember) => set({ admin, token, remember }),
      updateAdmin: (patch) => {
        const a = get().admin
        if (a) set({ admin: { ...a, ...patch } })
      },
      clear: () => set({ admin: null, token: null }),
    }),
    { name: `${STORE_CONFIG.storagePrefix}auth`, storage: createJSONStorage(() => hybridStorage) },
  ),
)

export const currentAdminName = () => useAuthStore.getState().admin?.name ?? 'System'
