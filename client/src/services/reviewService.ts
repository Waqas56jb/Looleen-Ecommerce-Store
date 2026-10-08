import { reviews } from '@/data/reviews'
import { useAccountStore } from '@/store/account'
import { useAuthStore } from '@/store/auth'
import type { Review } from '@/types'
import { delay, uid } from '@/utils'

export interface ReviewSummary {
  average: number
  count: number
  /** index 0 → 5 stars … index 4 → 1 star */
  breakdown: number[]
}

/** Seed reviews + reviews the customer wrote locally */
export function getReviews(productId: string): Promise<Review[]> {
  const mine = useAccountStore.getState().myReviews.filter((r) => r.productId === productId)
  return delay([...mine, ...reviews.filter((r) => r.productId === productId)])
}

export function summarize(list: Review[], fallback?: { rating: number; count: number }): ReviewSummary {
  const breakdown = [0, 0, 0, 0, 0]
  list.forEach((r) => (breakdown[5 - Math.round(r.rating)] += 1))
  if (fallback) {
    // Scale the sample distribution up to the product’s published review count
    const scale = fallback.count / Math.max(1, list.length)
    return { average: fallback.rating, count: fallback.count, breakdown: breakdown.map((n) => Math.round(n * scale)) }
  }
  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0
  return { average: Math.round(avg * 10) / 10, count: list.length, breakdown }
}

export function submitReview(input: { productId: string; rating: number; title: string; comment: string }): Promise<Review> {
  const user = useAuthStore.getState().user
  const review: Review = {
    id: uid('rv'),
    productId: input.productId,
    author: user ? user.name.split(' ')[0] + ' ' + (user.name.split(' ')[1]?.[0] ?? '') + '.' : 'Guest',
    city: 'Riyadh',
    rating: input.rating,
    title: input.title,
    comment: input.comment,
    date: new Date().toISOString().slice(0, 10),
    verified: !!user,
    helpful: 0,
  }
  useAccountStore.getState().addReview(review)
  return delay(review, 300)
}
