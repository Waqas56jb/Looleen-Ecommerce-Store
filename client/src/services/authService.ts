/**
 * Mock authentication service. NOT production auth — it only simulates the
 * API shape (OTP + email/password) so the UI can be wired to a real backend
 * later by replacing these function bodies.
 */
import { STORE_CONFIG } from '@/config/store'
import { demoUser } from '@/data/users'
import { useAuthStore } from '@/store/auth'
import type { User } from '@/types'
import { delay, normalizeSaudiPhone, uid } from '@/utils'

export class AuthError extends Error {
  code: 'invalid_otp' | 'invalid_credentials' | 'email_taken'
  constructor(code: AuthError['code']) {
    super(code)
    this.code = code
  }
}

const fakeToken = () => `mock.${uid('tkn')}`

/** Step 1 of phone login — "sends" an OTP (always 123456 in mock mode) */
export async function loginWithPhone(phone: string): Promise<{ phone: string; expiresIn: number }> {
  return delay({ phone: normalizeSaudiPhone(phone), expiresIn: 60 }, 500)
}

/** Step 2 of phone login */
export async function verifyOtp(phone: string, otp: string): Promise<User> {
  await delay(null, 500)
  if (otp !== STORE_CONFIG.mockOtp) throw new AuthError('invalid_otp')
  const normalized = normalizeSaudiPhone(phone)
  const user: User = normalized === demoUser.phone ? demoUser : { ...demoUser, id: uid('u'), phone: normalized }
  useAuthStore.getState().setSession(user, fakeToken())
  return user
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  await delay(null, 500)
  if (password.length < 6) throw new AuthError('invalid_credentials')
  const user: User = email.trim().toLowerCase() === demoUser.email ? demoUser : { ...demoUser, id: uid('u'), email: email.trim(), name: demoUser.name }
  useAuthStore.getState().setSession(user, fakeToken())
  return user
}

export async function register(input: { name: string; email: string; phone: string; password: string }): Promise<User> {
  await delay(null, 600)
  if (input.email.trim().toLowerCase() === 'taken@example.com') throw new AuthError('email_taken')
  const user: User = {
    id: uid('u'),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: normalizeSaudiPhone(input.phone),
    loyaltyPoints: 100,
    memberSince: new Date().toISOString().slice(0, 10),
    gender: '',
  }
  useAuthStore.getState().setSession(user, fakeToken())
  return user
}

export async function requestPasswordReset(email: string): Promise<{ email: string }> {
  return delay({ email }, 500)
}

export async function logout(): Promise<void> {
  useAuthStore.getState().clearSession()
  await delay(null, 100)
}

export function getCurrentUser(): Promise<User | null> {
  return delay(useAuthStore.getState().user, 50)
}

export async function updateProfile(patch: Partial<User>): Promise<User | null> {
  await delay(null, 350)
  useAuthStore.getState().updateUser(patch)
  return useAuthStore.getState().user
}
