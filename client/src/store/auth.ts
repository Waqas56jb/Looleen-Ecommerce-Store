import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORE_CONFIG } from '@/config/store'
import type { User } from '@/types'

/**
 * Session state only. All auth logic (OTP, credentials, registration) lives in
 * services/authService.ts so it can be swapped for a real backend.
 */
interface AuthState {
  user: User | null
  token: string | null
  setSession: (user: User, token: string) => void
  updateUser: (patch: Partial<User>) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setSession: (user, token) => set({ user, token }),
      updateUser: (patch) => {
        const u = get().user
        if (u) set({ user: { ...u, ...patch } })
      },
      clearSession: () => set({ user: null, token: null }),
    }),
    { name: `${STORE_CONFIG.storagePrefix}auth`, storage: createJSONStorage(() => localStorage) },
  ),
)

export const useIsAuthenticated = () => useAuthStore((s) => !!s.user)
