import { brands as baseBrands } from '../catalog/brands'
import { categories as baseCategories } from '../catalog/categories'
import { products as baseProducts } from '../catalog/products'
import type { AdminBrand, AdminCategory, AdminProduct, ProductVariant, StockMovement } from '@/types'
import { daysAgo, rng, round2 } from './helpers'

const r = rng(20261008)

/* ---------------- Categories (flattened tree) ---------------- */

export const seedCategories: AdminCategory[] = baseCategories.flatMap((c, ci) => [
  {
    id: c.slug,
    name: c.name,
    slug: c.slug,
    parentId: null,
    description: c.description,
    image: c.image,
    seoTitle: `${c.name.en} — Original Beauty | LOOKS`,
    seoDescription: c.description.en.slice(0, 155),
    status: 'active' as const,
    sortOrder: ci + 1,
    createdAt: daysAgo(400 - ci * 3),
  },
  ...c.subcategories.map((s, si) => ({
    id: s.slug,
    name: s.name,
    slug: s.slug,
    parentId: c.slug,
    description: { en: `Shop original ${s.name.en.toLowerCase()} from authorized distributors.`, ar: `تسوقي ${s.name.ar} أصلية من موزعين معتمدين.` },
    image: s.image ?? c.image,
    seoTitle: `${s.name.en} | LOOKS`,
    seoDescription: `Original ${s.name.en.toLowerCase()} products delivered across Saudi Arabia.`,
    status: 'active' as const,
    sortOrder: si + 1,
    createdAt: daysAgo(390 - ci * 3 - si),
  })),
])

/* ---------------- Brands ---------------- */

const DISTRIBUTORS = [
  'Riyadh Beauty Distribution Co.',
  'Gulf Cosmetics Trading Est.',
  'Najd Luxury Brands Co.',
  'Red Sea Beauty Agencies',
  'Eastern Province Cosmetics Ltd.',
  'Arabian Salon Supplies Co.',
  'Al Waha Fragrance Agencies',
  'Kingdom Dermocosmetics Co.',
]

export const seedBrands: AdminBrand[] = baseBrands.map((b, i) => ({
  id: b.id,
  name: b.name,
  nameAr: b.nameAr,
  slug: b.slug,
  logo: undefined,
  banner: b.image,
  description: b.description,
  country: b.country,
  website: `https://www.${b.slug.replace(/-/g, '')}.com`,
  distributor: DISTRIBUTORS[i % DISTRIBUTORS.length],
  authorized: i % 17 !== 16,
  featured: b.isFeatured,
  status: i % 23 === 22 ? 'inactive' : 'active',
  createdAt: daysAgo(380 - i * 6),
}))

/* ---------------- Products ---------------- */

function variantsOf(p: (typeof baseProducts)[number]): ProductVariant[] {
  if (p.shades.length) {
    return p.shades.map((s, i) => ({
      id: `${p.id}-${s.id}`,
      kind: 'shade' as const,
      name: s.name,
      hex: s.hex,
      sku: `${p.sku}-${s.id.toUpperCase()}`,
      price: p.price,
      stock: Math.max(0, Math.round(p.stock / p.shades.length) + ((i * 7) % 5) - 2),
      status: 'active' as const,
    }))
  }
  return p.sizes.map((s) => ({
    id: `${p.id}-${s.id}`,
    kind: 'size' as const,
    name: s.label,
    sku: `${p.sku}-${s.id.toUpperCase()}`,
    price: s.price ?? p.price,
    stock: Math.max(0, Math.round(p.stock / p.sizes.length)),
    status: 'active' as const,
  }))
}

export const seedProducts: AdminProduct[] = baseProducts.map((p, i) => {
  const brand = baseBrands.find((b) => b.id === p.brandId)!
  const unitsSold = p.salesCount
  const status = i === 12 || i === 58 ? 'draft' : i === 97 ? 'archived' : 'active'
  return {
    id: p.id,
    name: p.name,
    nameAr: `${brand.nameAr} — ${p.name}`,
    slug: p.slug,
    brandId: p.brandId,
    categoryId: p.category,
    subcategoryId: p.subcategory,
    sku: p.sku,
    barcode: p.barcode,
    shortDescription: p.shortDescription,
    description: p.description,
    ingredients: p.ingredients,
    howToUse: p.howToUse,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    costPrice: round2(p.price * (0.48 + r.next() * 0.14)),
    stock: p.stock,
    reserved: p.stock > 0 ? Math.min(p.stock, r.int(0, 6)) : 0,
    lowStockThreshold: p.category === 'salon-supplies' ? 20 : 10,
    weightGrams: p.category === 'beauty-devices' ? r.int(450, 1200) : r.int(60, 520),
    images: p.images,
    variants: variantsOf(p),
    flags: {
      original: p.isOriginal,
      authorized: p.isAuthorized,
      featured: p.isFeatured,
      bestSeller: p.isBestSeller,
      trending: p.isTrending,
      newArrival: p.isNewArrival,
      sale: p.isOnSale,
      professional: p.professionalProduct,
    },
    seo: {
      title: `${brand.name} ${p.name} | LOOKS`,
      description: p.shortDescription.en.slice(0, 155),
      keywords: [brand.name.toLowerCase(), p.subcategory.replace(/-/g, ' '), ...p.concerns.slice(0, 2)],
    },
    tags: p.tags,
    rating: p.rating,
    reviewCount: p.reviewCount,
    unitsSold,
    revenue: round2(unitsSold * p.price),
    views: unitsSold * r.int(9, 22),
    addToCarts: Math.round(unitsSold * (1.6 + r.next())),
    status,
    createdAt: p.createdAt,
    updatedAt: daysAgo(r.int(0, 25), r.int(0, 20)),
  }
})

/* ---------------- Stock movements ---------------- */

const USERS = ['Mohammed B Amr', 'Faisal Al-Otaibi', 'Hessa Al-Ghamdi']

export const seedMovements: StockMovement[] = seedProducts.flatMap((p, i) => {
  const list: StockMovement[] = [
    { id: `mv-${p.id}-1`, productId: p.id, type: 'purchase', quantity: p.stock + r.int(20, 80), reference: `PO-2026-${1200 + i}`, reason: 'Received shipment from authorized distributor', user: USERS[i % 3], date: daysAgo(40 + (i % 20)) },
    { id: `mv-${p.id}-2`, productId: p.id, type: 'sale', quantity: -r.int(8, 40), reference: `Orders batch W${36 + (i % 4)}`, user: 'System', date: daysAgo(12 + (i % 9)) },
  ]
  if (i % 4 === 0) list.push({ id: `mv-${p.id}-3`, productId: p.id, type: 'return', quantity: r.int(1, 3), reference: `RT-2026-${300 + i}`, reason: 'Customer return — resaleable', user: USERS[(i + 1) % 3], date: daysAgo(6 + (i % 5)) })
  if (i % 7 === 0) list.push({ id: `mv-${p.id}-4`, productId: p.id, type: 'damage', quantity: -r.int(1, 2), reference: 'WH-QC', reason: 'Damaged in warehouse', user: USERS[2], date: daysAgo(4 + (i % 3)) })
  if (i % 9 === 0) list.push({ id: `mv-${p.id}-5`, productId: p.id, type: 'adjustment', quantity: r.int(-3, 3) || 1, reference: 'Cycle count', reason: 'Inventory correction', user: USERS[1], date: daysAgo(2) })
  return list
})
