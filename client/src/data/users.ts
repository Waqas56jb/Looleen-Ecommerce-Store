import type { User } from '@/types'

/** Demo account — log in with this email (any password ≥ 6 chars) or phone + OTP 123456 */
export const demoUser: User = {
  id: 'u-1001',
  name: 'Noura Al-Qahtani',
  email: 'noura@example.com',
  phone: '+966 55 123 4567',
  gender: 'female',
  dateOfBirth: '1996-04-18',
  loyaltyPoints: 1240,
  memberSince: '2025-02-11',
  isProfessional: false,
}

export const users: User[] = [demoUser]
