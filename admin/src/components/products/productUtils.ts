import type { ProductFilters, ProductRow } from '@/services/productService'
import type { AdminCategory, DerivedProductStatus, Lang } from '@/types'

/** Boolean flag filters shown as toggles (URL key = ProductFilters key) */
export const FLAG_FILTERS = ['original', 'authorized', 'featured', 'bestSeller', 'newArrival', 'professional'] as const
export type FlagFilter = (typeof FLAG_FILTERS)[number]

/** Every URL key the products list understands (used for "clear all") */
export const PRODUCT_FILTER_KEYS = ['category', 'brand', 'status', 'stock', 'minPrice', 'maxPrice', 'rating', ...FLAG_FILTERS]

export const PRODUCT_STATUSES: DerivedProductStatus[] = ['active', 'draft', 'archived', 'out_of_stock']

/** URL params → service filters */
export function parseProductFilters(get: (key: string) => string): ProductFilters {
  const num = (k: string) => {
    const v = get(k)
    if (v === '') return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  const f: ProductFilters = {}
  if (get('category')) f.categoryId = get('category')
  if (get('brand')) f.brandId = get('brand')
  if (get('status')) f.status = get('status') as DerivedProductStatus
  const stock = get('stock')
  if (stock === 'in' || stock === 'low' || stock === 'out') f.stock = stock
  f.minPrice = num('minPrice')
  f.maxPrice = num('maxPrice')
  f.minRating = num('rating')
  FLAG_FILTERS.forEach((k) => {
    if (get(k) === '1') f[k] = true
  })
  return f
}

export function discountPercent(price: number, compareAt?: number): number {
  if (!compareAt || compareAt <= price || price <= 0) return 0
  return Math.round(((compareAt - price) / compareAt) * 100)
}

export function marginPercent(price: number, cost: number): number | null {
  if (!price || price <= 0) return null
  return Math.round(((price - cost) / price) * 1000) / 10
}

/** Category select options: top-level categories followed by their indented subcategories */
export function categoryOptions(cats: AdminCategory[], lang: Lang) {
  const tops = cats.filter((c) => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder)
  return tops.flatMap((top) => [
    { value: top.id, label: top.name[lang] || top.name.en },
    ...cats
      .filter((c) => c.parentId === top.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({ value: c.id, label: ` ${c.name[lang] || c.name.en}` })),
  ])
}

/** Flat rows for CSV export */
export function productCsvRows(rows: ProductRow[]) {
  return rows.map((p) => ({
    ID: p.id,
    Name: p.name,
    'Name (AR)': p.nameAr,
    SKU: p.sku,
    Barcode: p.barcode,
    Brand: p.brandName,
    Category: p.categoryName,
    Subcategory: p.subcategoryName,
    'Price (SAR)': p.price,
    'Compare-at (SAR)': p.compareAtPrice ?? '',
    'Cost (SAR)': p.costPrice,
    Stock: p.stock,
    Reserved: p.reserved,
    'Low stock threshold': p.lowStockThreshold,
    Status: p.derivedStatus,
    Rating: p.rating,
    Reviews: p.reviewCount,
    'Units sold': p.unitsSold,
    'Revenue (SAR)': p.revenue,
    Original: p.flags.original ? 'Yes' : 'No',
    Authorized: p.flags.authorized ? 'Yes' : 'No',
    Featured: p.flags.featured ? 'Yes' : 'No',
    Updated: p.updatedAt,
  }))
}
