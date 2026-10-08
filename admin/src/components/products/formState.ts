import { isSkuTaken, isSlugTaken, type ProductInput } from '@/services/productService'
import type { AdminProduct, LocalizedText, ProductFlags, ProductSEO, ProductStatus, ProductVariant } from '@/types'

export const COLD_CHAIN_TAG = 'cold-chain'
export const FRAGILE_TAG = 'fragile'

export interface ProductFormState {
  name: string
  nameAr: string
  slug: string
  brandId: string
  categoryId: string
  subcategoryId: string
  sku: string
  barcode: string
  price: string
  compareAtPrice: string
  costPrice: string
  stock: string
  lowStockThreshold: string
  reserved: number
  weightGrams: string
  images: string[]
  variantKind: ProductVariant['kind']
  variants: ProductVariant[]
  shortDescription: LocalizedText
  description: LocalizedText
  ingredients: string
  howToUse: LocalizedText
  seo: ProductSEO
  flags: ProductFlags
  status: ProductStatus
  tags: string[]
  coldChain: boolean
  fragile: boolean
}

const emptyText = (): LocalizedText => ({ en: '', ar: '' })

export function emptyFormState(): ProductFormState {
  return {
    name: '',
    nameAr: '',
    slug: '',
    brandId: '',
    categoryId: '',
    subcategoryId: '',
    sku: '',
    barcode: '',
    price: '',
    compareAtPrice: '',
    costPrice: '',
    stock: '0',
    lowStockThreshold: '10',
    reserved: 0,
    weightGrams: '',
    images: [],
    variantKind: 'shade',
    variants: [],
    shortDescription: emptyText(),
    description: emptyText(),
    ingredients: '',
    howToUse: emptyText(),
    seo: { title: '', description: '', keywords: [] },
    flags: { original: true, authorized: false, featured: false, bestSeller: false, trending: false, newArrival: true, sale: false, professional: false },
    status: 'active',
    tags: [],
    coldChain: false,
    fragile: false,
  }
}

export function formStateFromProduct(p: AdminProduct): ProductFormState {
  return {
    name: p.name,
    nameAr: p.nameAr,
    slug: p.slug,
    brandId: p.brandId,
    categoryId: p.categoryId,
    subcategoryId: p.subcategoryId,
    sku: p.sku,
    barcode: p.barcode,
    price: String(p.price),
    compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
    costPrice: String(p.costPrice ?? ''),
    stock: String(p.stock),
    lowStockThreshold: String(p.lowStockThreshold),
    reserved: p.reserved,
    weightGrams: p.weightGrams ? String(p.weightGrams) : '',
    images: [...p.images],
    variantKind: p.variants[0]?.kind ?? 'shade',
    variants: p.variants.map((v) => ({ ...v })),
    shortDescription: { ...p.shortDescription },
    description: { ...p.description },
    ingredients: p.ingredients,
    howToUse: { ...p.howToUse },
    seo: { ...p.seo, keywords: [...p.seo.keywords] },
    flags: { ...p.flags },
    status: p.status,
    tags: p.tags.filter((tg) => tg !== COLD_CHAIN_TAG && tg !== FRAGILE_TAG),
    coldChain: p.tags.includes(COLD_CHAIN_TAG),
    fragile: p.tags.includes(FRAGILE_TAG),
  }
}

const n = (v: string) => (v.trim() === '' ? NaN : Number(v))

export function toProductInput(s: ProductFormState, status: ProductStatus): ProductInput {
  const compare = n(s.compareAtPrice)
  return {
    name: s.name.trim(),
    nameAr: s.nameAr.trim(),
    slug: s.slug.trim(),
    brandId: s.brandId,
    categoryId: s.categoryId,
    subcategoryId: s.subcategoryId,
    sku: s.sku.trim(),
    barcode: s.barcode.trim(),
    price: n(s.price) || 0,
    compareAtPrice: Number.isFinite(compare) && compare > 0 ? compare : undefined,
    costPrice: n(s.costPrice) || 0,
    stock: Math.floor(n(s.stock) || 0),
    reserved: s.reserved,
    lowStockThreshold: Math.floor(n(s.lowStockThreshold) || 0),
    weightGrams: n(s.weightGrams) || 0,
    images: s.images,
    variants: s.variants.map((v) => ({ ...v, kind: s.variantKind, name: v.name.trim(), sku: v.sku.trim() || `${s.sku.trim()}-${v.name.trim().toUpperCase().replace(/\s+/g, '')}` })),
    shortDescription: s.shortDescription,
    description: s.description,
    ingredients: s.ingredients,
    howToUse: s.howToUse,
    seo: s.seo,
    flags: s.flags,
    status,
    tags: [...s.tags, ...(s.coldChain ? [COLD_CHAIN_TAG] : []), ...(s.fragile ? [FRAGILE_TAG] : [])],
  }
}

/** Ordered so the first error is the top-most field on screen */
export function validateProduct(s: ProductFormState, status: ProductStatus, productId?: string): Record<string, string> {
  const e: Record<string, string> = {}
  const k = 'products.form.errors.'
  if (!s.name.trim()) e.name = k + 'nameRequired'
  if (!s.slug.trim()) e.slug = k + 'slugRequired'
  else if (isSlugTaken(s.slug.trim(), productId)) e.slug = k + 'slugTaken'
  if (!s.brandId) e.brandId = k + 'brandRequired'
  if (!s.categoryId) e.categoryId = k + 'categoryRequired'
  if (!s.subcategoryId) e.subcategoryId = k + 'subcategoryRequired'
  if (!s.sku.trim()) e.sku = k + 'skuRequired'
  else if (isSkuTaken(s.sku.trim(), productId)) e.sku = k + 'skuTaken'
  const price = n(s.price)
  if (!(price > 0)) e.price = k + 'priceRequired'
  const compare = n(s.compareAtPrice)
  if (s.compareAtPrice.trim() && !(compare > (price || 0))) e.compareAtPrice = k + 'compareAt'
  if (s.costPrice.trim() && !(n(s.costPrice) >= 0)) e.costPrice = k + 'cost'
  if (!(n(s.stock) >= 0)) e.stock = k + 'stock'
  if (!(n(s.lowStockThreshold) >= 0)) e.lowStockThreshold = k + 'threshold'
  if (status === 'active' && s.images.length === 0) e.images = k + 'imageRequired'
  if (s.variants.some((v) => !v.name.trim())) e.variants = k + 'variantName'
  if (s.weightGrams.trim() && !(n(s.weightGrams) >= 0)) e.weightGrams = k + 'weight'
  return e
}

/** DOM id for a form field (used for scroll-to-error) */
export const fid = (key: string) => `pf-${key}`
