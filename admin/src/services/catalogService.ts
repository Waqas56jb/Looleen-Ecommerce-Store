/**
 * Brands & categories API (mock).
 */
import { all, write } from '@/store/db'
import type { AdminBrand, AdminCategory, ListQuery, Paginated } from '@/types'
import { delay, nowIso, queryList, uid } from '@/utils'
import { logActivity, NotFoundError } from './_core'

/* ================================ Brands ================================ */

export interface BrandRow extends AdminBrand {
  productCount: number
  unitsSold: number
  revenue: number
}

function enrichBrand(b: AdminBrand): BrandRow {
  const products = all('products').filter((p) => p.brandId === b.id)
  return {
    ...b,
    productCount: products.length,
    unitsSold: products.reduce((s, p) => s + p.unitsSold, 0),
    revenue: products.reduce((s, p) => s + p.revenue, 0),
  }
}

export function getBrands(q: ListQuery & { filters?: { status?: string; featured?: boolean; authorized?: boolean } } = {}): Promise<Paginated<BrandRow>> {
  const f = q.filters ?? {}
  const rows = all('brands')
    .map(enrichBrand)
    .filter((b) => (!f.status || b.status === f.status) && (f.featured === undefined || b.featured === f.featured) && (f.authorized === undefined || b.authorized === f.authorized))
  return delay(queryList(rows, { sortBy: 'name', sortDir: 'asc', ...q }, { searchFields: [(b) => b.name, (b) => b.nameAr, (b) => b.country, (b) => b.distributor] }))
}

export function getAllBrands(): Promise<BrandRow[]> {
  return delay(all('brands').map(enrichBrand).sort((a, b) => a.name.localeCompare(b.name)))
}

export function getBrand(id: string): Promise<BrandRow | undefined> {
  const b = all('brands').find((x) => x.id === id)
  return delay(b ? enrichBrand(b) : undefined)
}

export async function getBrandStats() {
  const rows = all('brands').map(enrichBrand)
  return delay({
    total: rows.length,
    active: rows.filter((b) => b.status === 'active').length,
    withProducts: rows.filter((b) => b.productCount > 0).length,
    featured: rows.filter((b) => b.featured).length,
    authorized: rows.filter((b) => b.authorized).length,
  })
}

export type BrandInput = Omit<AdminBrand, 'id' | 'createdAt'>

export async function createBrand(input: BrandInput): Promise<AdminBrand> {
  const brand: AdminBrand = { ...input, id: input.slug || uid('brand'), createdAt: nowIso() }
  if (all('brands').some((b) => b.id === brand.id)) brand.id = uid(brand.slug)
  write('brands', [brand, ...all('brands')])
  logActivity('created', 'brand', `Brand '${brand.name}' was created.`, brand.id)
  return delay(brand)
}

export async function updateBrand(id: string, patch: Partial<AdminBrand>): Promise<AdminBrand> {
  const existing = all('brands').find((b) => b.id === id)
  if (!existing) throw new NotFoundError('Brand', id)
  const updated = { ...existing, ...patch, id }
  write('brands', all('brands').map((b) => (b.id === id ? updated : b)))
  logActivity('updated', 'brand', `Brand '${updated.name}' was updated.`, id)
  return delay(updated)
}

/** Brands with products cannot be deleted — returns false in that case */
export async function deleteBrand(id: string): Promise<boolean> {
  const b = all('brands').find((x) => x.id === id)
  if (all('products').some((p) => p.brandId === id)) return delay(false)
  write('brands', all('brands').filter((x) => x.id !== id))
  if (b) logActivity('deleted', 'brand', `Brand '${b.name}' was deleted.`, id)
  return delay(true)
}

/* ============================== Categories ============================== */

export interface CategoryNode extends AdminCategory {
  productCount: number
  children: CategoryNode[]
}

function countFor(c: AdminCategory): number {
  return all('products').filter((p) => p.categoryId === c.id || p.subcategoryId === c.id).length
}

export function getCategoryTree(): Promise<CategoryNode[]> {
  const cats = all('categories')
  const build = (parentId: string | null): CategoryNode[] =>
    cats
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({ ...c, productCount: countFor(c), children: build(c.id) }))
  return delay(build(null))
}

export function getCategories(): Promise<(AdminCategory & { productCount: number })[]> {
  return delay(all('categories').map((c) => ({ ...c, productCount: countFor(c) })))
}

export function getCategory(id: string): Promise<AdminCategory | undefined> {
  return delay(all('categories').find((c) => c.id === id))
}

export type CategoryInput = Omit<AdminCategory, 'id' | 'createdAt'>

export async function createCategory(input: CategoryInput): Promise<AdminCategory> {
  const cat: AdminCategory = { ...input, id: all('categories').some((c) => c.id === input.slug) ? uid(input.slug) : input.slug, createdAt: nowIso() }
  write('categories', [...all('categories'), cat])
  logActivity('created', 'category', `Category '${cat.name.en}' was created.`, cat.id)
  return delay(cat)
}

export async function updateCategory(id: string, patch: Partial<AdminCategory>): Promise<AdminCategory> {
  const existing = all('categories').find((c) => c.id === id)
  if (!existing) throw new NotFoundError('Category', id)
  const updated = { ...existing, ...patch, id }
  write('categories', all('categories').map((c) => (c.id === id ? updated : c)))
  logActivity('updated', 'category', `Category '${updated.name.en}' was updated.`, id)
  return delay(updated)
}

/** Deletes a category and its subcategories; refuses when products are assigned */
export async function deleteCategory(id: string): Promise<boolean> {
  const cats = all('categories')
  const ids = new Set([id, ...cats.filter((c) => c.parentId === id).map((c) => c.id)])
  if (all('products').some((p) => ids.has(p.categoryId) || ids.has(p.subcategoryId))) return delay(false)
  const c = cats.find((x) => x.id === id)
  write('categories', cats.filter((x) => !ids.has(x.id)))
  if (c) logActivity('deleted', 'category', `Category '${c.name.en}' was deleted.`, id)
  return delay(true)
}

/** Persist a new sibling order (ids in display order) */
export async function reorderCategories(parentId: string | null, orderedIds: string[]): Promise<void> {
  write(
    'categories',
    all('categories').map((c) => (c.parentId === parentId && orderedIds.includes(c.id) ? { ...c, sortOrder: orderedIds.indexOf(c.id) + 1 } : c)),
  )
  logActivity('updated', 'category', 'Category order was updated.')
  return delay(undefined)
}
