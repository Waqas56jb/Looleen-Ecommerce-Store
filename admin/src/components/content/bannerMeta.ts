import type { Banner, BannerPlacement } from '@/types'

export const PLACEMENTS: BannerPlacement[] = ['homepage_hero', 'editorial', 'category', 'promotional', 'mobile_hero']
export const BANNER_STATUSES: Banner['status'][] = ['published', 'scheduled', 'draft']

/** Click-through rate as a percentage (0 when no impressions) */
export function ctr(b: Pick<Banner, 'clicks' | 'impressions'>): number {
  return b.impressions > 0 ? (b.clicks / b.impressions) * 100 : 0
}

/** Relative storefront path (/…) or absolute http(s) URL */
export function isValidCtaUrl(url: string): boolean {
  if (/^\/[^\s]*$/.test(url)) return true
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}
