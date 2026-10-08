/**
 * Product API (mock). Every function returns a Promise so the mock data
 * source can be replaced with real HTTP calls without touching the UI.
 */
import { products } from '@/data/products'
import type { Product, ProductFilters, SortOption } from '@/types'
import { delay } from '@/utils'
import { applyFilters, sortProducts } from '@/utils/catalog'

export interface ProductQuery extends ProductFilters {
  sort?: SortOption
  page?: number
  pageSize?: number
}

export interface ProductPage {
  items: Product[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function getProducts(): Promise<Product[]> {
  return delay(products)
}

/** Filter + sort + paginate in one call (what a real catalog endpoint would do) */
export function queryProducts(q: ProductQuery = {}): Promise<ProductPage> {
  const { sort = 'featured', page = 1, pageSize = 24, ...filters } = q
  const filtered = sortProducts(applyFilters(products, filters), sort)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  return delay({
    items: filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    total: filtered.length,
    page: safePage,
    pageSize,
    totalPages,
  })
}

export function getProductBySlug(slug: string): Promise<Product | undefined> {
  return delay(products.find((p) => p.slug === slug))
}

export function getProductsByIds(ids: string[]): Promise<Product[]> {
  const map = new Map(products.map((p) => [p.id, p]))
  return delay(ids.map((id) => map.get(id)).filter((p): p is Product => !!p), 120)
}

export function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return delay(products.filter((p) => p.isFeatured).slice(0, limit))
}

export function getBestSellingProducts(limit = 12): Promise<Product[]> {
  return delay(sortProducts(products.filter((p) => p.isBestSeller), 'best-selling').slice(0, limit))
}

export function getTrendingProducts(limit = 8): Promise<Product[]> {
  return delay(products.filter((p) => p.isTrending).slice(0, limit))
}

export function getNewArrivals(limit = 12): Promise<Product[]> {
  return delay(sortProducts(products.filter((p) => p.isNewArrival), 'newest').slice(0, limit))
}

export function getOnSaleProducts(limit = 24): Promise<Product[]> {
  return delay(sortProducts(products.filter((p) => p.isOnSale), 'discount').slice(0, limit))
}

export function getProfessionalProducts(limit = 8): Promise<Product[]> {
  return delay(products.filter((p) => p.professionalProduct).slice(0, limit))
}

export function getProductsByCategory(slug: string, sort: SortOption = 'featured'): Promise<Product[]> {
  return delay(sortProducts(applyFilters(products, { category: slug }), sort))
}

export function getProductsByBrand(brandId: string, sort: SortOption = 'featured'): Promise<Product[]> {
  return delay(sortProducts(products.filter((p) => p.brandId === brandId), sort))
}

export function getProductsByConcern(concern: string, limit = 12): Promise<Product[]> {
  return delay(products.filter((p) => p.concerns.includes(concern as never)).slice(0, limit))
}

/** Same subcategory first, then same category, excluding the product itself */
export function getRelatedProducts(product: Product, limit = 8): Promise<Product[]> {
  const others = products.filter((p) => p.id !== product.id)
  const sameSub = others.filter((p) => p.subcategory === product.subcategory)
  const sameCat = others.filter((p) => p.category === product.category && p.subcategory !== product.subcategory)
  return delay([...sameSub, ...sameCat].slice(0, limit))
}
