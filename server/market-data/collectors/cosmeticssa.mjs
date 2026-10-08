/**
 * Cosmetics.sa (https://cosmetics.sa) collector — Salla platform.
 *
 * The storefront HTML (all pages) is behind a Cloudflare managed challenge (403, cf-mitigated: challenge),
 * which we do NOT bypass. Data comes from Salla's public storefront JSON API — the same API the store's own
 * frontend calls — with no auth, cookies or tokens:
 *   GET https://api.salla.dev/store/v1/products?per_page=15   header Store-Identifier: cosmetics.sa
 * Cursor pagination (15 products/page, cursor.next).
 *
 * Pass 1 (accept-language: en): id -> English name / brand / category / /en/ product URL (1 extra call per page)
 * Pass 2 (accept-language: ar): writes one record per product, merged with the pass-1 English fields.
 *
 * Usage: node collectors/cosmeticssa.mjs [--limit N] [--fresh]
 */
import fs from 'node:fs'
import path from 'node:path'
import { politeFetch } from '../lib/http.mjs'
import { RecordWriter, writeReport, splitArEn, hasArabic, parseSize, normalizeBarcode, RAW_DIR } from '../lib/record.mjs'

const STORE_ID = 'cosmeticssa'
const STORE_NAME = 'Cosmetics.sa'
const BASE = 'https://cosmetics.sa'
const DOMAIN = 'cosmetics.sa'
const API = 'https://api.salla.dev/store/v1/products?per_page=15'
const DELAY = 1100

const args = process.argv.slice(2)
const li = args.indexOf('--limit')
const LIMIT = li >= 0 ? parseInt(args[li + 1], 10) : Infinity
const FRESH = args.includes('--fresh')
const START = Date.now()
const BUDGET_MS = 85 * 60 * 1000
const stats = { enPages: 0, arPages: 0, failed: 0, withOptions: 0, budgetHit: false }

async function* pages(lang, maxProducts = Infinity) {
  let url = API
  let n = 0
  while (url) {
    if (Date.now() - START > BUDGET_MS) {
      stats.budgetHit = true
      console.warn('time budget reached, stopping')
      return
    }
    const res = await politeFetch(url, { json: true, headers: { 'Store-Identifier': DOMAIN, 'accept-language': lang }, delayMs: DELAY, cache: !FRESH })
    if (!res.ok || !Array.isArray(res.data?.data)) {
      stats.failed++
      console.warn('request failed', res.status, String(JSON.stringify(res.data)).slice(0, 200), url)
      return
    }
    yield res.data.data
    n += res.data.data.length
    if (n >= maxProducts) return
    url = res.data.cursor?.next || null
  }
}

const latin = (s) => !!s && /[A-Za-z]/.test(s) && !hasArabic(s)

async function main() {
  const file = path.join(RAW_DIR, STORE_ID + '.jsonl')
  if (FRESH && fs.existsSync(file)) fs.unlinkSync(file)

  // Pass 1: English
  const en = new Map()
  for await (const batch of pages('en', LIMIT)) {
    stats.enPages++
    for (const p of batch) en.set(String(p.id), { name: p.name?.replace(/\s+/g, ' ').trim(), brand: p.brand?.name?.trim(), category: p.category?.name?.trim(), url: p.url })
    if (stats.enPages % 50 === 0) console.log('en page', stats.enPages, en.size)
  }

  // Pass 2: Arabic + write
  const w = new RecordWriter(STORE_ID)
  const startCount = w.count
  let seen = 0
  for await (const batch of pages('ar', LIMIT)) {
    stats.arPages++
    for (const p of batch) {
      if (seen >= LIMIT) break
      seen++
      const e = en.get(String(p.id)) ?? {}
      const arName = (p.name ?? '').replace(/\s+/g, ' ').trim()
      let nameAr = null
      let nameEn = null
      if (latin(e.name)) {
        nameEn = e.name
        nameAr = hasArabic(arName) ? arName : null
      } else if (hasArabic(arName) && /[A-Za-z]/.test(arName)) {
        const s = splitArEn(arName)
        nameAr = arName
        nameEn = /[A-Za-z]{3,}/.test(s.en ?? '') ? s.en : null
      } else if (hasArabic(arName)) nameAr = arName
      else nameEn = arName
      const brand = (latin(e.brand) ? e.brand : null) || p.brand?.name?.trim() || null
      const category = (latin(e.category) ? e.category : null) || p.category?.name?.trim() || null
      if (p.has_options) stats.withOptions++
      const price = p.price ?? p.sale_price ?? p.starting_price
      const original = p.is_on_sale && p.regular_price > price ? p.regular_price : null
      const sku = p.sku ? String(p.sku).trim() : null
      const size = parseSize(arName)?.text ?? parseSize(e.name)?.text ?? null
      w.write({
        storeName: STORE_NAME,
        url: e.url || p.url || `${BASE}/p${p.id}`,
        storeProductId: p.id,
        name: arName || e.name,
        nameAr,
        nameEn,
        brand,
        category,
        variant: null,
        size,
        barcode: normalizeBarcode(p.gtin) || normalizeBarcode(sku) || normalizeBarcode(p.mpn) || null,
        sku: sku || p.mpn || null,
        price,
        originalPrice: original,
        inStock: typeof p.is_available === 'boolean' ? p.is_available && !p.is_out_of_stock : null,
        imageUrl: p.image?.url ?? null,
      })
    }
    if (stats.arPages % 50 === 0) console.log('ar page', stats.arPages, 'written', w.count)
  }

  const recs = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []
  const pct = (f) => Math.round((recs.filter(f).length / Math.max(1, recs.length)) * 1000) / 10
  const cats = new Set(recs.map((r) => r.category).filter(Boolean))
  writeReport(STORE_ID, {
    storeName: STORE_NAME,
    baseUrl: BASE,
    platform: 'Salla',
    method: `public Salla storefront JSON API (api.salla.dev/store/v1/products, Store-Identifier: ${DOMAIN}), cursor pagination, en + ar passes`,
    categoriesCovered: [...cats].sort(),
    recordsWritten: recs.length,
    recordsWrittenThisRun: w.count - startCount,
    recordsRejected: w.rejected,
    withBarcode: recs.filter((r) => r.barcode).length,
    withBrand: recs.filter((r) => r.brand).length,
    withSize: recs.filter((r) => r.size).length,
    withOriginalPrice: recs.filter((r) => r.originalPrice).length,
    coveragePct: { brand: pct((r) => r.brand), size: pct((r) => r.size), barcode: pct((r) => r.barcode), sku: pct((r) => r.sku), originalPrice: pct((r) => r.originalPrice), nameEn: pct((r) => r.nameEn), category: pct((r) => r.category), inStock: pct((r) => r.inStock === true) },
    blocked: false,
    stats,
    runtimeMinutes: Math.round((Date.now() - START) / 6000) / 10,
    notes: [
      'Storefront HTML is behind a Cloudflare managed challenge (403); it was not bypassed. Data comes from the public Salla storefront API the site itself uses (no auth/cookies/tokens).',
      'One record per product (parent level). Products with options (has_options) list their base/starting price; variant/shade prices are not expanded.',
      'nameEn/brand/category prefer the English (accept-language: en) values when the store provides real English text; otherwise Arabic, or splitArEn on mixed names.',
      'category = the API primary category name (single level, not a full path); it may be a merchandising list.',
      'barcode = gtin, else sku or mpn when it is a checksum-valid EAN/UPC. sku = raw SKU (or mpn).',
      'url = the /en/ public product URL returned by the API. Prices are SAR as returned by the storefront API; originalPrice = regular_price when on sale.',
      'Beauty-only store; no category filtering applied.',
    ],
  })
  console.log(`${STORE_ID} done: ${recs.length} records (${w.count - startCount} new), rejected ${w.rejected}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
