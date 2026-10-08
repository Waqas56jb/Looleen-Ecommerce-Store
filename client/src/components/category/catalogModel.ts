/**
 * Catalog filter model — the single source of truth for how listing filters
 * are represented in the URL and translated into a `ProductQuery`.
 *
 * URL params (all optional, arrays are comma-separated):
 *   brands, price, rating, discount, stock=1, skin, hair, concern, pro=1, sort, view=list, page
 */
import type { Concern, HairType, PriceRange, Product, ProductFilters, SkinType, SortOption } from '@/types'
import { PRICE_RANGES, SORT_OPTIONS, facetCounts } from '@/utils/catalog'

export const PAGE_SIZE = 24

export const PRICE_OPTIONS = Object.keys(PRICE_RANGES) as PriceRange[]
export const RATING_OPTIONS = [4, 4.5] as const
export const DISCOUNT_OPTIONS = [10, 20, 30, 50] as const

export interface CatalogFilters {
  brands: string[]
  price: PriceRange[]
  rating?: number
  discount?: number
  stock: boolean
  skin: SkinType[]
  hair: HairType[]
  concern: Concern[]
  pro: boolean
}

export type ArrayFilterKey = 'brands' | 'price' | 'skin' | 'hair' | 'concern'
export type FacetKey = keyof CatalogFilters
export type CatalogViewMode = 'grid' | 'list'

export const FILTER_PARAM_KEYS: FacetKey[] = ['brands', 'price', 'rating', 'discount', 'stock', 'skin', 'hair', 'concern', 'pro']

const list = (v: string | null) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [])
const num = (v: string | null) => {
  const n = v ? Number(v) : NaN
  return Number.isFinite(n) && n > 0 ? n : undefined
}

export function parseFilters(sp: URLSearchParams): CatalogFilters {
  return {
    brands: list(sp.get('brands')),
    price: list(sp.get('price')).filter((p): p is PriceRange => p in PRICE_RANGES),
    rating: num(sp.get('rating')),
    discount: num(sp.get('discount')),
    stock: sp.get('stock') === '1',
    skin: list(sp.get('skin')) as SkinType[],
    hair: list(sp.get('hair')) as HairType[],
    concern: list(sp.get('concern')) as Concern[],
    pro: sp.get('pro') === '1',
  }
}

export function parseSort(sp: URLSearchParams): SortOption {
  const s = sp.get('sort') as SortOption | null
  return s && SORT_OPTIONS.includes(s) ? s : 'featured'
}

/** Writes one filter value into a copy of the params (empty values are removed) */
export function writeFilter(sp: URLSearchParams, key: FacetKey, value: CatalogFilters[FacetKey]): URLSearchParams {
  const next = new URLSearchParams(sp)
  if (Array.isArray(value)) {
    if (value.length) next.set(key, value.join(','))
    else next.delete(key)
  } else if (typeof value === 'boolean') {
    if (value) next.set(key, '1')
    else next.delete(key)
  } else if (typeof value === 'number' && value > 0) {
    next.set(key, String(value))
  } else {
    next.delete(key)
  }
  return next
}

/** URL facets + page-level base filters → service filters */
export function toProductFilters(base: ProductFilters, f: CatalogFilters): ProductFilters {
  return {
    ...base,
    brands: base.brands?.length ? base.brands : f.brands,
    priceRanges: f.price,
    minRating: f.rating,
    minDiscount: f.discount,
    inStockOnly: f.stock || undefined,
    skinTypes: f.skin,
    hairTypes: f.hair,
    concerns: f.concern,
    professionalOnly: f.pro || base.professionalOnly || undefined,
  }
}

export function countActive(f: CatalogFilters, hidden: FacetKey[] = []): number {
  let n = 0
  for (const key of FILTER_PARAM_KEYS) {
    if (hidden.includes(key)) continue
    const v = f[key]
    if (Array.isArray(v)) n += v.length
    else if (v) n += 1
  }
  return n
}

/* ---------------- Facets ---------------- */

export interface FacetOption<V extends string | number = string> {
  value: V
  count: number
  label?: string
}

export interface CatalogFacets {
  total: number
  brands: FacetOption[]
  price: FacetOption<PriceRange>[]
  rating: FacetOption<number>[]
  discount: FacetOption<number>[]
  inStock: number
  skin: FacetOption[]
  hair: FacetOption[]
  concern: FacetOption[]
  pro: number
}

const toOptions = (m: Map<string, number>) =>
  [...m.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }))

/** Facet options + counts from the page's base (facet-unfiltered) product set */
export function buildFacets(products: Product[]): CatalogFacets {
  const fc = facetCounts(products)
  const brandNames = new Map(products.map((p) => [p.brandId, p.brandName]))
  return {
    total: products.length,
    brands: [...fc.brands.entries()]
      .map(([value, count]) => ({ value, count, label: brandNames.get(value) ?? value }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    price: PRICE_OPTIONS.map((r) => ({
      value: r,
      count: products.filter((p) => p.price >= PRICE_RANGES[r][0] && p.price < PRICE_RANGES[r][1]).length,
    })),
    rating: RATING_OPTIONS.map((r) => ({ value: r, count: products.filter((p) => p.rating >= r).length })),
    discount: DISCOUNT_OPTIONS.map((d) => ({ value: d, count: products.filter((p) => p.discountPercentage >= d).length })),
    inStock: products.filter((p) => p.stockStatus !== 'out_of_stock').length,
    skin: toOptions(fc.skin),
    hair: toOptions(fc.hair),
    concern: toOptions(fc.concerns),
    pro: products.filter((p) => p.professionalProduct).length,
  }
}
