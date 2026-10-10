import type { ApprovalRules, Retailer, SourcingProduct, Supplier } from '@/types/sourcing'
import { SOURCING_DATA } from './sourcing.data'

/** Supplier price lists provided by LOOKS (costs VAT-exclusive) */
export const seedSuppliers: Supplier[] = [
  {
    id: 'sup-wella',
    name: 'Wella Professionals',
    priceList: 'Wella Professionals price list (PDF)',
    priceListDate: '2026-10-01',
    itemsInList: 726,
    priceBasis: 'WSP — net salon purchase price after discount (0 / 25 / 35%), SAR excl. VAT',
    contact: 'Authorized Wella distributor — Saudi Arabia',
    vatIncluded: false,
  },
  {
    id: 'sup-keune',
    name: 'Keune',
    priceList: 'Keune price list 2024 (PDF)',
    priceListDate: '2026-10-01',
    itemsInList: 363,
    priceBasis: 'Salon list price × (1 − discount), SAR excl. VAT',
    contact: 'Authorized Keune distributor — Saudi Arabia',
    vatIncluded: false,
  },
]

const google = (site: string) => `https://www.google.com/search?q=site%3A${site}+{q}`

/**
 * Saudi retailers compared for every product. "automatic" prices come from the
 * LOOKS price collector (public product pages, robots.txt respected); "manual"
 * retailers do not allow automated collection, so a team member verifies the
 * price on the live page and records it (price, seller, stock, link, date).
 */
export const seedRetailers: Retailer[] = [
  { id: 'nahdi', name: 'Nahdi Online', url: 'https://www.nahdionline.com/', collection: 'automatic', note: 'Public catalog', noteAr: 'كتالوج عام', searchUrl: google('nahdionline.com') },
  { id: 'whites', name: 'Whites', url: 'https://www.whites.sa/', collection: 'automatic', note: 'Public catalog', noteAr: 'كتالوج عام', searchUrl: google('whites.sa') },
  { id: 'niceone', name: 'Nice One', url: 'https://niceonesa.com/', collection: 'automatic', note: 'Public catalog', noteAr: 'كتالوج عام', searchUrl: google('niceonesa.com') },
  { id: 'faces', name: 'Faces', url: 'https://www.faces.sa/', collection: 'automatic', note: 'Public catalog', noteAr: 'كتالوج عام', searchUrl: google('faces.sa') },
  { id: 'looieen', name: 'Looieen', url: 'https://looieen.com/', collection: 'automatic', note: 'Public catalog', noteAr: 'كتالوج عام', searchUrl: google('looieen.com') },
  { id: 'watsons', name: 'Watsons', url: 'https://www.watsons.sa/', collection: 'automatic', note: 'Public catalog', noteAr: 'كتالوج عام', searchUrl: google('watsons.sa') },
  { id: 'amazon', name: 'Amazon.sa', url: 'https://www.amazon.sa/', collection: 'manual', note: 'Terms of use prohibit automated collection — verify manually (official Selling Partner API later)', noteAr: 'شروط الاستخدام تمنع الجمع الآلي — تحقق يدوياً (لاحقاً عبر واجهة Selling Partner الرسمية)', searchUrl: 'https://www.amazon.sa/s?k={q}' },
  { id: 'noon', name: 'Noon', url: 'https://www.noon.com/saudi-en/', collection: 'manual', note: 'Terms of use prohibit automated collection — verify manually (partner access later)', noteAr: 'شروط الاستخدام تمنع الجمع الآلي — تحقق يدوياً (لاحقاً عبر وصول الشركاء)', searchUrl: 'https://www.noon.com/saudi-en/search/?q={q}' },
  { id: 'keunesaudi', name: 'Keune Saudi (official)', url: 'https://keunesaudi.com/', collection: 'manual', note: 'Site protection blocks automated access — verify manually', noteAr: 'حماية الموقع تمنع الوصول الآلي — تحقق يدوياً', searchUrl: google('keunesaudi.com'), brands: ['Keune'] },
  { id: 'goldenscent', name: 'Golden Scent', url: 'https://www.goldenscent.com/', collection: 'manual', note: 'Site opts out of AI-assisted collection — verify manually', noteAr: 'الموقع لا يسمح بالجمع بمساعدة الذكاء الاصطناعي — تحقق يدوياً', searchUrl: google('goldenscent.com') },
  { id: 'sephora', name: 'Sephora KSA', url: 'https://www.sephora.me/sa-en', collection: 'manual', note: 'Site protection blocks automated access — verify manually', noteAr: 'حماية الموقع تمنع الوصول الآلي — تحقق يدوياً', searchUrl: google('sephora.me') },
  { id: 'aldawaa', name: 'Al-Dawaa', url: 'https://www.al-dawaa.com/', collection: 'manual', note: 'Site protection blocks automated access — verify manually', noteAr: 'حماية الموقع تمنع الوصول الآلي — تحقق يدوياً', searchUrl: google('al-dawaa.com') },
]

export const seedRules: ApprovalRules = {
  minRetailers: 4,
  maxPriceAgeDays: 30,
  minMargin: 0.25,
  requireVerifiedCost: true,
}

/** 10 real Wella & Keune products: supplier cost + verified retailer prices */
export const seedSourcing: SourcingProduct[] = SOURCING_DATA.map((p) => ({
  ...p,
  offers: p.offers.map((o) => ({
    ...o,
    // Costs come from the supplier price lists LOOKS provided
    costVerified: true,
    costVerifiedBy: 'Supplier price list provided by LOOKS',
    costVerifiedAt: '2026-10-01T09:00:00.000Z',
  })),
  history: [
    { at: '2026-10-01T09:00:00.000Z', by: 'System', action: 'imported', note: `Supplier price list imported — ${p.offers.map((o) => `${o.code} @ SAR ${o.netCost.toFixed(2)} excl. VAT`).join(', ')}` },
    ...p.prices.map((c) => ({ at: c.verifiedAt, by: c.verifiedBy, action: 'price_added' as const, note: `${c.seller}: SAR ${c.price.toFixed(2)} (${c.matchBy === 'barcode' ? 'barcode match' : 'brand + size + name match'})` })),
  ],
}))
