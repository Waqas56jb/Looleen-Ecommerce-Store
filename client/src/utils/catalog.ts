import type { PriceRange, Product, ProductFilters, SortOption } from '@/types'

export const PRICE_RANGES: Record<PriceRange, [number, number]> = {
  '0-100': [0, 100],
  '100-250': [100, 250],
  '250-500': [250, 500],
  '500+': [500, Infinity],
}

export const SORT_OPTIONS: SortOption[] = ['featured', 'newest', 'best-selling', 'price-asc', 'price-desc', 'rating', 'discount']

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[''`]/g, '')
}

/** Text match across name, brand, category, tags and concerns */
export function matchesQuery(p: Product, query: string): boolean {
  const terms = norm(query).split(/\s+/).filter(Boolean)
  if (!terms.length) return true
  const hay = norm(
    [p.name, p.brandName, p.category, p.subcategory.replace(/-/g, ' '), ...p.tags, ...p.concerns, p.shortDescription.en, p.shortDescription.ar].join(' '),
  )
  return terms.every((t) => hay.includes(t))
}

/** Client-side filter engine — all filters are AND-ed, values within a filter are OR-ed */
export function applyFilters(list: Product[], f: ProductFilters): Product[] {
  return list.filter((p) => {
    if (f.category && p.category !== f.category && p.subcategory !== f.category) return false
    if (f.subcategory && p.subcategory !== f.subcategory) return false
    if (f.brands?.length && !f.brands.includes(p.brandId)) return false
    if (f.priceRanges?.length && !f.priceRanges.some((r) => p.price >= PRICE_RANGES[r][0] && p.price < PRICE_RANGES[r][1])) return false
    if (f.minRating && p.rating < f.minRating) return false
    if (f.minDiscount && p.discountPercentage < f.minDiscount) return false
    if (f.inStockOnly && p.stockStatus === 'out_of_stock') return false
    if (f.skinTypes?.length && !f.skinTypes.some((s) => p.skinTypes.includes(s))) return false
    if (f.hairTypes?.length && !f.hairTypes.some((h) => p.hairTypes.includes(h))) return false
    if (f.concerns?.length && !f.concerns.some((c) => p.concerns.includes(c))) return false
    if (f.professionalOnly && !p.professionalProduct) return false
    if (f.onSaleOnly && !p.isOnSale) return false
    if (f.query && !matchesQuery(p, f.query)) return false
    return true
  })
}

export function sortProducts(list: Product[], sort: SortOption): Product[] {
  const out = [...list]
  switch (sort) {
    case 'newest':
      return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'best-selling':
      return out.sort((a, b) => b.salesCount - a.salesCount)
    case 'price-asc':
      return out.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return out.sort((a, b) => b.price - a.price)
    case 'rating':
      return out.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    case 'discount':
      return out.sort((a, b) => b.discountPercentage - a.discountPercentage)
    case 'featured':
    default:
      return out.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || Number(b.isBestSeller) - Number(a.isBestSeller) || b.salesCount - a.salesCount)
  }
}

/** Facet counts so filter UIs can show "(12)" next to options */
export function facetCounts(list: Product[]) {
  const brands = new Map<string, number>()
  const skin = new Map<string, number>()
  const hair = new Map<string, number>()
  const concerns = new Map<string, number>()
  for (const p of list) {
    brands.set(p.brandId, (brands.get(p.brandId) ?? 0) + 1)
    p.skinTypes.forEach((s) => skin.set(s, (skin.get(s) ?? 0) + 1))
    p.hairTypes.forEach((h) => hair.set(h, (hair.get(h) ?? 0) + 1))
    p.concerns.forEach((c) => concerns.set(c, (concerns.get(c) ?? 0) + 1))
  }
  return { brands, skin, hair, concerns }
}

/** Effective unit price for a cart line (size variants can change price) */
export function unitPrice(p: Product, sizeId?: string): { price: number; compareAtPrice?: number } {
  const size = sizeId ? p.sizes.find((s) => s.id === sizeId) : undefined
  return { price: size?.price ?? p.price, compareAtPrice: size?.compareAtPrice ?? p.compareAtPrice }
}

export function variantLabel(p: Product, shadeId?: string, sizeId?: string): string | undefined {
  const parts = [p.shades.find((s) => s.id === shadeId)?.name, p.sizes.find((s) => s.id === sizeId)?.label].filter(Boolean)
  return parts.length ? parts.join(' · ') : undefined
}
