/**
 * Looieen (looieen.com) collector — Salla platform.
 *
 * The storefront HTML is behind a Cloudflare "human verification" challenge, which we do NOT bypass.
 * Instead we use Salla's public storefront JSON API (the same API the store's own frontend calls):
 *   GET https://api.salla.dev/store/v1/products            header Store-Identifier: looieen.com
 *   GET ...?source=categories&source_value[]=<categoryId>   (per-category listing, for category paths)
 * Pagination is cursor based (15 products / page, `cursor.next`). No auth, no cookies, no tokens.
 *
 * Pass 1: walk the real (non-promo) category taxonomy leaves → map productId → "A > B > C".
 * Pass 2: walk the full product listing and write one record per product.
 *
 * Usage: node collectors/looieen.mjs [--limit N] [--fresh] [--no-categories]
 */
import fs from 'node:fs'
import path from 'node:path'
import { politeFetch } from '../lib/http.mjs'
import { RecordWriter, writeReport, splitArEn, parseSize, normalizeBarcode, RAW_DIR, ROOT } from '../lib/record.mjs'

const STORE_ID = 'looieen'
const STORE_NAME = 'Looieen'
const BASE = 'https://looieen.com/'
const API = 'https://api.salla.dev/store/v1/products'
const HEADERS = { 'Store-Identifier': 'looieen.com', 'accept-language': 'ar' }
const DELAY = 1100

const args = process.argv.slice(2)
const argVal = (k) => {
  const i = args.indexOf(k)
  return i >= 0 ? args[i + 1] : null
}
const LIMIT = argVal('--limit') ? parseInt(argVal('--limit'), 10) : Infinity
const FRESH = args.includes('--fresh')
const SKIP_CATS = args.includes('--no-categories') || Number.isFinite(LIMIT)
const START = Date.now()
const BUDGET_MS = 85 * 60 * 1000

/* Category taxonomy (ids from the earlier aggregate scan of the public API; promo/offer lists excluded) */
function loadTaxonomy() {
  const f = path.join(path.dirname(ROOT), 'scraped.json')
  if (!fs.existsSync(f)) return { leaves: [], byName: new Map() }
  const tree = JSON.parse(fs.readFileSync(f, 'utf8')).categoryTree ?? []
  const PROMO = /عروض|أفضل|تخفيضات|الماركات|الترند|الكورية/
  const leaves = []
  const byName = new Map()
  const walk = (c, trail) => {
    const p = [...trail, c.name.trim()]
    if (!byName.has(c.name.trim())) byName.set(c.name.trim(), p.join(' > '))
    const subs = c.subcategories ?? []
    if (!subs.length && c.numericId) leaves.push({ id: c.numericId, path: p.join(' > ') })
    subs.forEach((s) => walk(s, p))
  }
  for (const c of tree) if (!PROMO.test(c.name)) walk(c, [])
  return { leaves, byName }
}

async function* pages(startUrl, maxProducts = Infinity) {
  let url = startUrl
  let n = 0
  while (url) {
    if (Date.now() - START > BUDGET_MS) {
      console.warn('time budget reached, stopping')
      return
    }
    const res = await politeFetch(url, { json: true, headers: HEADERS, delayMs: DELAY, cache: !FRESH })
    if (!res.ok || !Array.isArray(res.data?.data)) {
      console.warn('request failed', res.status, String(res.data).slice(0, 200), url)
      return
    }
    yield res.data.data
    n += res.data.data.length
    if (n >= maxProducts) return
    url = res.data.cursor?.next || null
  }
}

const stats = { pages: 0, catPages: 0, failed: 0, withOptions: 0, categoriesWalked: 0 }

async function main() {
  const { leaves, byName } = loadTaxonomy()
  const catOf = new Map()
  if (!SKIP_CATS) {
    for (const leaf of leaves) {
      const url = `${API}?source=categories&source_value[]=${leaf.id}`
      for await (const batch of pages(url)) {
        stats.catPages++
        for (const p of batch) if (!catOf.has(String(p.id))) catOf.set(String(p.id), leaf.path)
      }
      stats.categoriesWalked++
      console.log(`category ${leaf.path}: map size ${catOf.size}`)
    }
  }

  const w = new RecordWriter(STORE_ID)
  const startCount = w.count
  let seenInListing = 0
  for await (const batch of pages(`${API}?per_page=15`, LIMIT)) {
    stats.pages++
    for (const p of batch) {
      if (seenInListing >= LIMIT) break
      seenInListing++
      const name = (p.name ?? '').replace(/\s+/g, ' ').trim()
      const latin = /[A-Za-z]/.test(name)
      const split = splitArEn(name)
      const ar = latin ? split.ar : name
      const en = latin && /[A-Za-z]/.test(split.en ?? '') ? split.en : null
      const primary = p.category?.name?.trim() || null
      const category = catOf.get(String(p.id)) || (primary && byName.get(primary)) || primary
      if (p.has_options) stats.withOptions++
      const price = p.price ?? p.sale_price ?? p.starting_price
      const original = p.is_on_sale && p.regular_price > price ? p.regular_price : null
      const sku = p.sku ? String(p.sku).trim() : null
      const size = parseSize(name)?.text ?? null
      w.write({
        storeName: STORE_NAME,
        url: p.url || `${BASE}p${p.id}`,
        storeProductId: p.id,
        name,
        nameAr: ar,
        nameEn: en,
        brand: p.brand?.name ?? null,
        category,
        variant: null,
        size,
        barcode: normalizeBarcode(p.gtin) || normalizeBarcode(sku) || null,
        sku: sku || p.mpn || null,
        price,
        originalPrice: original,
        inStock: typeof p.is_available === 'boolean' ? p.is_available && !p.is_out_of_stock : null,
        imageUrl: p.image?.url ?? p.original_image ?? null,
      })
    }
    if (stats.pages % 50 === 0) console.log(`listing page ${stats.pages}: written ${w.count}`)
  }

  // coverage from the file
  const recs = fs
    .readFileSync(path.join(RAW_DIR, `${STORE_ID}.jsonl`), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l))
  const pct = (f) => Math.round((recs.filter(f).length / Math.max(1, recs.length)) * 1000) / 10
  const cats = new Set(recs.map((r) => r.category).filter(Boolean))
  writeReport(STORE_ID, {
    storeName: STORE_NAME,
    baseUrl: BASE,
    method: 'public Salla storefront JSON API (api.salla.dev/store/v1/products, Store-Identifier: looieen.com), cursor pagination',
    categoriesCovered: [...cats].sort(),
    recordsWritten: recs.length,
    recordsWrittenThisRun: w.count - startCount,
    recordsRejected: w.rejected,
    withBarcode: recs.filter((r) => r.barcode).length,
    withBrand: recs.filter((r) => r.brand).length,
    withSize: recs.filter((r) => r.size).length,
    withOriginalPrice: recs.filter((r) => r.originalPrice).length,
    coveragePct: { brand: pct((r) => r.brand), size: pct((r) => r.size), barcode: pct((r) => r.barcode), sku: pct((r) => r.sku), originalPrice: pct((r) => r.originalPrice), category: pct((r) => r.category) },
    blocked: false,
    stats,
    runtimeMinutes: Math.round((Date.now() - START) / 6000) / 10,
    notes: [
      'Storefront HTML is behind a Cloudflare human-verification challenge (403); it was not bypassed. Data comes from the public Salla storefront API the site itself uses (no auth/cookies).',
      'Listing returns 15 products/page; one record per product (parent level). Products with options (has_options) list their base/starting price; variant-level prices/shades are not expanded.',
      'Names are Arabic (often mixed with English); nameAr/nameEn are derived with splitArEn. The API returns no separate English name.',
      'barcode = gtin, or the SKU when it is a checksum-valid EAN/UPC (Looieen typically stores the barcode as SKU). sku keeps the raw SKU.',
      'category = full taxonomy path from walking non-promo leaf categories; fallback to the API primary category name (mapped to a path when it matches the tree), which may be a promo list name.',
      'Prices as displayed by the storefront API (SAR). originalPrice = regular_price when the product is on sale.',
    ],
  })
  console.log(`done: ${recs.length} records (${w.count - startCount} new), rejected ${w.rejected}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
