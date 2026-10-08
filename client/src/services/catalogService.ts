/**
 * Categories, brands and editorial content (mock API).
 */
import { heroBanners } from '@/data/banners'
import { brands } from '@/data/brands'
import { categories, findCategory } from '@/data/categories'
import { flashDealEndsAt, offers } from '@/data/offers'
import { products } from '@/data/products'
import { testimonials } from '@/data/testimonials'
import type { Banner, Brand, Category, Offer, Testimonial } from '@/types'
import { delay } from '@/utils'

/* ---------------- Categories ---------------- */

export function getCategories(): Promise<Category[]> {
  return delay(categories, 80)
}

/** Resolves either a top-level category or a subcategory slug */
export function getCategoryBySlug(slug: string) {
  return delay(findCategory(slug), 80)
}

/** Product count per category / subcategory slug */
export function getCategoryCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  products.forEach((p) => {
    counts[p.category] = (counts[p.category] ?? 0) + 1
    counts[p.subcategory] = (counts[p.subcategory] ?? 0) + 1
  })
  return delay(counts, 60)
}

/* ---------------- Brands ---------------- */

export interface BrandWithCount extends Brand {
  productCount: number
}

function withCounts(list: Brand[]): BrandWithCount[] {
  return list.map((b) => ({ ...b, productCount: products.filter((p) => p.brandId === b.id).length }))
}

export function getBrands(): Promise<BrandWithCount[]> {
  return delay(withCounts([...brands].sort((a, b) => a.name.localeCompare(b.name))))
}

export function getFeaturedBrands(): Promise<BrandWithCount[]> {
  return delay(withCounts(brands.filter((b) => b.isFeatured)))
}

export function getBrandBySlug(slug: string): Promise<BrandWithCount | undefined> {
  const b = brands.find((x) => x.slug === slug)
  return delay(b ? withCounts([b])[0] : undefined)
}

/* ---------------- Editorial ---------------- */

export function getHeroBanners(): Promise<Banner[]> {
  return delay(heroBanners, 60)
}

export function getOffers(): Promise<Offer[]> {
  return delay(offers)
}

export function getFlashDealEnd(): Promise<string> {
  return delay(flashDealEndsAt, 40)
}

export function getTestimonials(): Promise<Testimonial[]> {
  return delay(testimonials)
}
