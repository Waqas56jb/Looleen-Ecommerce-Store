import { brands } from '@/data/brands'
import { categories } from '@/data/categories'
import { products } from '@/data/products'
import type { SearchSuggestions } from '@/types'
import { delay } from '@/utils'
import { matchesQuery, sortProducts } from '@/utils/catalog'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’`]/g, '')

/** Instant suggestions grouped by products / brands / categories */
export function getSearchSuggestions(query: string, limit = 5): Promise<SearchSuggestions> {
  const q = norm(query.trim())
  if (!q) return delay({ products: [], brands: [], categories: [] }, 0)
  const matchedProducts = sortProducts(products.filter((p) => matchesQuery(p, q)), 'best-selling').slice(0, limit)
  const matchedBrands = brands.filter((b) => norm(b.name).includes(q) || b.nameAr.includes(query.trim())).slice(0, 4)
  const cats: SearchSuggestions['categories'] = []
  categories.forEach((c) => {
    if (norm(c.name.en).includes(q) || c.name.ar.includes(query.trim())) cats.push({ slug: c.slug, name: c.name })
    c.subcategories.forEach((s) => {
      if (norm(s.name.en).includes(q) || s.name.ar.includes(query.trim())) cats.push({ slug: s.slug, name: s.name, parent: c.slug })
    })
  })
  // Also surface the category of matched products (e.g. "L'Oreal" → Skin Care)
  matchedProducts.forEach((p) => {
    if (cats.length < 4 && !cats.some((c) => c.slug === p.subcategory)) {
      const parent = categories.find((c) => c.slug === p.category)
      const sub = parent?.subcategories.find((s) => s.slug === p.subcategory)
      if (sub) cats.push({ slug: sub.slug, name: sub.name, parent: parent!.slug })
    }
  })
  return delay({ products: matchedProducts, brands: matchedBrands, categories: cats.slice(0, 4) }, 120)
}

export const POPULAR_SEARCHES = ['Olaplex', 'Niacinamide', 'Dior', 'Sunscreen', 'Foundation', 'Oud', 'Dyson', 'K18']
