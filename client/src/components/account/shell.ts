import { createContext, useContext } from 'react'

/** true when a page is rendered inside the AccountLayout sidebar shell */
export const AccountShellContext = createContext(false)

export const useInAccountShell = () => useContext(AccountShellContext)

export type LoyaltyTierId = 'rose' | 'gold' | 'platinum'

export const LOYALTY_TIERS: { id: LoyaltyTierId; min: number }[] = [
  { id: 'rose', min: 0 },
  { id: 'gold', min: 1000 },
  { id: 'platinum', min: 3000 },
]

/** Rose < 1000 ≤ Gold < 3000 ≤ Platinum */
export function loyaltyTier(points: number) {
  let idx = 0
  LOYALTY_TIERS.forEach((tier, i) => {
    if (points >= tier.min) idx = i
  })
  const current = LOYALTY_TIERS[idx]
  const next = LOYALTY_TIERS[idx + 1]
  const progress = next ? (points - current.min) / (next.min - current.min) : 1
  return { current, next, progress, remaining: next ? next.min - points : 0 }
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? ''
