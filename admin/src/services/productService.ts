/**
 * Products API (mock). Replace function bodies with HTTP calls later —
 * signatures and return types are the contract the UI depends on.
 */
import { all, write } from '@/store/db'
import type { AdminProduct, DerivedProductStatus, ListQuery, Paginated } from '@/types'
import { delay, nowIso, queryList, uid } from '@/utils'
import { inList, logActivity, NotFoundError, productStatus } from './_core'

export interface ProductRow extends AdminProduct {
  brandName: string
  categoryName: string
  subcategoryName: string
  derivedStatus: DerivedProductStatus
}

export interface ProductFilters {
  categoryId?: string | string[]
  brandId?: string | string[]
  status?: DerivedProductStatus | DerivedProductStatus[]
  stock?: 'in' | 'low' | 'out'
  minPrice?: number
  maxPrice?: number
  minRating?: number
  original?: boolean
  authorized?: boolean
  featured?: boolean
  bestSeller?: boolean
  newArrival?: boolean
  professional?: boolean
}

function enrich(p: AdminProduct): ProductRow {
  const brand = all('brands').find((b) => b.id === p.brandId)
  const cats = all('categories')
  return {
    ...p,
    brandName: brand?.name ?? p.brandId,
    categoryName: cats.find((c) => c.id === p.categoryId)?.name.en ?? p.categoryId,
    subcategoryName: cats.find((c) => c.id === p.subcategoryId)?.name.en ?? p.subcategoryId,
    derivedStatus: productStatus(p),
  }
}

function filterRows(rows: ProductRow[], f: ProductFilters = {}): ProductRow[] {
  return rows.filter((p) => {
    if (!inList(p.categoryId, f.categoryId) && !inList(p.subcategoryId, f.categoryId)) return false
    if (!inList(p.brandId, f.brandId)) return false
    if (!inList(p.derivedStatus, f.status)) return false
    if (f.stock === 'out' && p.stock > 0) return false
    if (f.stock === 'low' && !(p.stock > 0 && p.stock <= p.lowStockThreshold)) return false
    if (f.stock === 'in' && p.stock <= p.lowStockThreshold) return false
    if (f.minPrice !== undefined && p.price < f.minPrice) return false
    if (f.maxPrice !== undefined && p.price > f.maxPrice) return false
    if (f.minRating && p.rating < f.minRating) return false
    if (f.original && !p.flags.original) return false
    if (f.authorized && !p.flags.authorized) return false
    if (f.featured && !p.flags.featured) return false
    if (f.bestSeller && !p.flags.bestSeller) return false
    if (f.newArrival && !p.flags.newArrival) return false
    if (f.professional && !p.flags.professional) return false
    return true
  })
}

export function getProducts(q: ListQuery & { filters?: ProductFilters } = {}): Promise<Paginated<ProductRow>> {
  const rows = filterRows(all('products').map(enrich), q.filters as ProductFilters)
  return delay(
    queryList(rows, { sortBy: 'updatedAt', sortDir: 'desc', ...q }, {
      searchFields: [(p) => p.name, (p) => p.sku, (p) => p.brandName, (p) => p.barcode, (p) => p.nameAr],
      sortFields: { brand: (p) => p.brandName, category: (p) => p.categoryName },
    }),
  )
}

/** Full list (for selects, exports, reports) */
export function getAllProducts(): Promise<ProductRow[]> {
  return delay(all('products').map(enrich))
}

export async function getProductStats() {
  const rows = all('products').map(enrich)
  return delay({
    total: rows.length,
    active: rows.filter((p) => p.derivedStatus === 'active').length,
    draft: rows.filter((p) => p.status === 'draft').length,
    archived: rows.filter((p) => p.status === 'archived').length,
    outOfStock: rows.filter((p) => p.stock <= 0).length,
    lowStock: rows.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length,
  })
}

export function getProduct(id: string): Promise<ProductRow | undefined> {
  const p = all('products').find((x) => x.id === id)
  return delay(p ? enrich(p) : undefined)
}

export type ProductInput = Omit<AdminProduct, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount' | 'unitsSold' | 'revenue' | 'views' | 'addToCarts' | 'reserved'> &
  Partial<Pick<AdminProduct, 'reserved'>>

export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  const product: AdminProduct = { ...input, reserved: input.reserved ?? 0, id: uid('p'), rating: 0, reviewCount: 0, unitsSold: 0, revenue: 0, views: 0, addToCarts: 0, createdAt: nowIso(), updatedAt: nowIso() }
  write('products', [product, ...all('products')])
  logActivity('created', 'product', `Product '${product.name}' was created.`, product.id)
  return delay(product)
}

export async function updateProduct(id: string, patch: Partial<AdminProduct>): Promise<AdminProduct> {
  const list = all('products')
  const existing = list.find((p) => p.id === id)
  if (!existing) throw new NotFoundError('Product', id)
  const updated = { ...existing, ...patch, id, updatedAt: nowIso() }
  write('products', list.map((p) => (p.id === id ? updated : p)))
  logActivity('updated', 'product', `Product '${updated.name}' was updated.`, id)
  return delay(updated)
}

export async function deleteProduct(id: string): Promise<void> {
  const p = all('products').find((x) => x.id === id)
  write('products', all('products').filter((x) => x.id !== id))
  if (p) logActivity('deleted', 'product', `Product '${p.name}' was deleted.`, id)
  return delay(undefined)
}

/** Creates a draft copy with a new id + SKU */
export async function duplicateProduct(id: string): Promise<AdminProduct> {
  const src = all('products').find((p) => p.id === id)
  if (!src) throw new NotFoundError('Product', id)
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase()
  const copy: AdminProduct = {
    ...src,
    id: uid('p'),
    name: `${src.name} (Copy)`,
    slug: `${src.slug}-copy-${suffix.toLowerCase()}`,
    sku: `${src.sku}-C${suffix}`,
    variants: src.variants.map((v) => ({ ...v, id: uid('v'), sku: `${v.sku}-C${suffix}` })),
    status: 'draft',
    unitsSold: 0,
    revenue: 0,
    views: 0,
    addToCarts: 0,
    reviewCount: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  write('products', [copy, ...all('products')])
  logActivity('duplicated', 'product', `Product '${src.name}' was duplicated.`, copy.id)
  return delay(copy)
}

export type BulkProductAction = 'delete' | 'archive' | 'activate' | 'feature' | 'unfeature'

export async function bulkUpdateProducts(ids: string[], action: BulkProductAction): Promise<number> {
  const set = new Set(ids)
  if (action === 'delete') {
    write('products', all('products').filter((p) => !set.has(p.id)))
  } else {
    write(
      'products',
      all('products').map((p) => {
        if (!set.has(p.id)) return p
        if (action === 'archive') return { ...p, status: 'archived' as const, updatedAt: nowIso() }
        if (action === 'activate') return { ...p, status: 'active' as const, updatedAt: nowIso() }
        return { ...p, flags: { ...p.flags, featured: action === 'feature' }, updatedAt: nowIso() }
      }),
    )
  }
  logActivity(action === 'delete' ? 'deleted' : action === 'archive' ? 'archived' : 'updated', 'product', `Bulk ${action}: ${ids.length} products.`)
  return delay(ids.length)
}

export function isSlugTaken(slug: string, exceptId?: string): boolean {
  return all('products').some((p) => p.slug === slug && p.id !== exceptId)
}

export function isSkuTaken(sku: string, exceptId?: string): boolean {
  return all('products').some((p) => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== exceptId)
}
