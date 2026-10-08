/**
 * Mock admin authentication — NOT real security. It only simulates the API
 * shape so the UI can later call the backend's /auth endpoints.
 * Demo credentials: admin@beautystore.sa / Admin@123
 */
import { all } from '@/store/db'
import { useAuthStore } from '@/store/authStore'
import type { AdminUser } from '@/types'
import { delay, nowIso, uid } from '@/utils'
import { logActivity } from './_core'

export const DEMO_CREDENTIALS = { email: 'admin@beautystore.sa', password: 'Admin@123' }

export class AuthError extends Error {}

export async function login(email: string, password: string, remember = true): Promise<AdminUser> {
  await delay(null, 500)
  const admin = all('admins').find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
  const ok = admin && admin.status === 'active' && (admin.email === DEMO_CREDENTIALS.email ? password === DEMO_CREDENTIALS.password : password === DEMO_CREDENTIALS.password)
  if (!ok || !admin) throw new AuthError('invalid_credentials')
  const session = { ...admin, lastLoginAt: nowIso() }
  useAuthStore.getState().setSession(session, `mock.${uid('jwt')}`, remember)
  logActivity('login', 'session', 'Signed in to the admin panel.')
  return session
}

export async function logout(): Promise<void> {
  logActivity('logout', 'session', 'Signed out of the admin panel.')
  useAuthStore.getState().clear()
  return delay(undefined, 80)
}

export function getCurrentAdmin(): AdminUser | null {
  return useAuthStore.getState().admin
}

export function isAuthenticated(): boolean {
  return !!useAuthStore.getState().token
}

export async function requestPasswordReset(email: string): Promise<{ email: string }> {
  return delay({ email }, 500)
}

export async function updateProfile(patch: Partial<Pick<AdminUser, 'name' | 'phone' | 'email' | 'avatar'>>): Promise<AdminUser | null> {
  await delay(null, 300)
  useAuthStore.getState().updateAdmin(patch)
  logActivity('updated', 'settings', 'Admin profile was updated.')
  return useAuthStore.getState().admin
}

export async function changePassword(current: string, next: string): Promise<void> {
  await delay(null, 400)
  if (current !== DEMO_CREDENTIALS.password) throw new AuthError('wrong_password')
  if (next.length < 8) throw new AuthError('weak_password')
  logActivity('updated', 'settings', 'Admin password was changed.')
}
