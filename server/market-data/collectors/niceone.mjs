/**
 * Nice One (niceonesa.com, Saudi) collector.
 *
 * Method: public category listing pages (https://niceonesa.com/ar/<category>?page=N), which the
 * Nuxt storefront server-renders. Each page embeds its product grid in the __NUXT_DATA__ payload
 * (30 products/page) with Arabic name, English name, brand, current price, pre-discount price,
 * stock flag, SKU and ISBN/EAN barcode. No product pages and no private API are used.
 * robots.txt: ?page= is allowed; filters/sort/manufacturers/search are disallowed and not used.
 *
 * Usage: node collectors/niceone.mjs [--limit N] [--max-minutes M]
 */
import fs from 'node:fs'
import { politeFetch } from '../lib/http.mjs'
import { RecordWriter, writeReport, parseSize } from '../lib/record.mjs'

const STORE_ID = 'niceone'
const STORE_NAME = 'Nice One'
const BASE = 'https://niceonesa.com'
const DELAY = 1500
const PER_PAGE = 30

const args = process.argv.slice(2)
const argVal = (k, d) => {
  const i = args.indexOf(k)
  return i >= 0 ? Number(args[i + 1]) : d
}
const LIMIT = argVal('--limit', Infinity)
const MAX_MINUTES = argVal('--max-minutes', 85)
const started = Date.now()
const timeUp = () => Date.now() - started > MAX_MINUTES * 60_000

// Beauty categories only. Excluded: vitamins-supplements (Health & Nutrition), lenses,
// home-scents, bed-bath (towels/robes), accessories jewellery.
const CATEGORIES = [
  'makeup',
  'perfume',
  'care',
  'devices',
  'nails',
  'premium',
  'gifts',
]
// Product-level exclusions: a product's own primary category can sit outside beauty (home scents,
// towels, health) even when it is also listed in a beauty category; plus baby feeding/medical items in Care.
const EXCLUDE_CAT = /home scents|incense burner|oud & bakhoor|tela home|towels|robes|health & nutrition|nutraceuticals|health devices|sports nutrition|lenses/i
const EXCLUDE = /diaper|nappy|nappies|baby food|formula milk|infant formula|feeding|bottle|pacifier|teether|vitamin|supplement|medical|medicine|thermometer|blood pressure|glucose|contact lens/i

/* ---- devalue (Nuxt 3 payload) decoder ---- */
function decodeNuxt(html) {
  const m = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!m) return null
  let arr
  try {
    arr = JSON.parse(m[1])
  } catch {
    return null
  }
  const memo = new Map()
  const WRAP = new Set(['ShallowReactive', 'Reactive', 'Ref', 'ShallowRef', 'EmptyRef', 'EmptyShallowRef'])
  const rev = (i) => {
    if (typeof i !== 'number' || i < 0) return undefined
    if (memo.has(i)) return memo.get(i)
    const v = arr[i]
    if (Array.isArray(v)) {
      if (typeof v[0] === 'string' && WRAP.has(v[0])) {
        const r = rev(v[1])
        memo.set(i, r)
        return r
      }
      if (typeof v[0] === 'string' && ['Set', 'Map', 'Date', 'RegExp', 'BigInt', 'NuxtError', 'Error'].includes(v[0])) {
        memo.set(i, null)
        return null
      }
      const out = []
      memo.set(i, out)
      for (const x of v) out.push(rev(x))
      return out
    }
    if (v && typeof v === 'object') {
      const o = {}
      memo.set(i, o)
      for (const k in v) o[k] = rev(v[k])
      return o
    }
    memo.set(i, v)
    return v
  }
  return rev(0)
}

function extractListing(html) {
  const root = decodeNuxt(html)
  const data = root?.data
  if (!data) return null
  const d = Object.values(data).find((x) => x && Array.isArray(x.products))
  if (!d) return null
  return { products: d.products, total: Number(d.total) || 0 }
}

const num = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^\d.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null)

function toRecord(p, collectedAt) {
  if (!p || !p.id) return null
  const hierarchy = Array.isArray(p.category_hierarchy) ? p.category_hierarchy : []
  const catNames = hierarchy.map((c) => str(c.en_name) || str(c.name)).filter(Boolean)
  const nameAr = str(p.name)
  const nameEn = str(p.en_name)
  if (EXCLUDE_CAT.test(catNames.join(' > ')) || EXCLUDE.test(catNames.join(' ')) || EXCLUDE.test(nameEn ?? '')) return { excluded: true }
  const slug = str(p.seo_url_ar) || str(p.seo_url_en)
  if (!slug) return null
  const special = Array.isArray(p.special) && p.special.length ? p.special[0] : null
  const price = num(special?.priceWithoutCurrency) ?? num(p.price)
  const original = num(special?.originalPriceWithoutCurrency)
  return {
    storeName: STORE_NAME,
    url: `${BASE}/ar/${slug}`,
    storeProductId: String(p.id),
    name: nameAr || nameEn,
    nameEn,
    nameAr,
    brand: str(p.manufacturer),
    category: catNames.length ? catNames.join(' > ') : null,
    variant: null,
    size: parseSize(nameEn)?.text || parseSize(nameAr)?.text || null,
    barcode: str(p.isbn),
    sku: /^bin-na$/i.test(str(p.sku) ?? '') ? null : str(p.sku),
    price,
    originalPrice: original,
    inStock: typeof p.has_stock === 'boolean' ? p.has_stock : null,
    imageUrl: str(p.thumb),
    collectedAt,
  }
}

async function fetchPage(cat, page) {
  const url = page === 1 ? `${BASE}/ar/${cat}` : `${BASE}/ar/${cat}?page=${page}`
  const res = await politeFetch(url, { delayMs: DELAY })
  if (!res.ok) return { error: res.status, url }
  const listing = extractListing(res.data)
  if (!listing) return { error: 'no-listing-data', url }
  return { listing, url }
}

async function main() {
  const writer = new RecordWriter(STORE_ID)
  const startCount = writer.count
  const covered = []
  const failures = []
  let pagesFetched = 0
  let excluded = 0
  let stoppedEarly = false
  let limitHit = false

  const handle = (listing) => {
    const now = new Date().toISOString()
    for (const p of listing.products) {
      const rec = toRecord(p, now)
      if (!rec) continue
      if (rec.excluded) {
        excluded++
        continue
      }
      writer.write(rec)
      if (writer.count - startCount >= LIMIT) return true
    }
    return false
  }

  outer: for (const cat of CATEGORIES) {
    if (timeUp()) {
      stoppedEarly = true
      break
    }
    const first = await fetchPage(cat, 1)
    pagesFetched++
    if (first.error) {
      failures.push(`${first.url}: ${first.error}`)
      continue
    }
    const totalPages = Math.ceil(first.listing.total / PER_PAGE)
    covered.push(cat)
    console.log(`[${STORE_ID}] ${cat}: ${first.listing.total} products, ${totalPages} pages`)
    if (handle(first.listing)) {
      limitHit = true
      break
    }
    const retry = []
    for (let page = 2; page <= totalPages; page++) {
      if (timeUp()) {
        stoppedEarly = true
        break outer
      }
      const r = await fetchPage(cat, page)
      pagesFetched++
      if (r.error) {
        retry.push(page)
        continue
      }
      if (!r.listing.products.length) break
      if (handle(r.listing)) {
        limitHit = true
        break outer
      }
      if (page % 25 === 0) console.log(`  page ${page}/${totalPages} — records ${writer.count}`)
    }
    for (const page of retry) {
      const r = await fetchPage(cat, page)
      pagesFetched++
      if (r.error) {
        failures.push(`${r.url}: ${r.error}`)
        continue
      }
      if (handle(r.listing)) {
        limitHit = true
        break outer
      }
    }
  }

  const lines = fs.readFileSync(writer.file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
  const cnt = (f) => lines.filter(f).length
  writeReport(STORE_ID, {
    storeName: STORE_NAME,
    baseUrl: `${BASE}/ar`,
    method: 'Server-rendered category listing pages (/ar/<category>?page=N); product data read from the embedded Nuxt __NUXT_DATA__ payload (30 products/page). robots.txt respected.',
    categoriesCovered: covered,
    recordsWritten: lines.length,
    recordsWrittenThisRun: writer.count - startCount,
    recordsRejected: writer.rejected,
    recordsExcludedOutOfScope: excluded,
    withBarcode: cnt((r) => r.barcode),
    withBrand: cnt((r) => r.brand),
    withSize: cnt((r) => r.size),
    withOriginalPrice: cnt((r) => r.originalPrice),
    pagesFetched,
    blocked: false,
    stoppedEarly,
    limitHit,
    failures: failures.slice(0, 50),
    notes: [
      'Prices are SAR as displayed (VAT-inclusive). price = current price (special price when a sale is active); originalPrice = pre-discount price from the listing.',
      'Barcode = the listing "isbn" field (EAN) when it passes checksum validation; sku = Nice One SKU.',
      'Both Arabic (name/nameAr) and English (nameEn) names come from the same Arabic listing page.',
      'Products with shade/size options appear once (the listing default); variant not exposed in listings.',
      'Excluded: Health & Nutrition (vitamins/supplements), lenses, home scents, Tela Home towels, jewellery accessories, and baby feeding/diaper/medical items inside Care.',
      'Categories overlap (premium/gifts re-list makeup/perfume items); records are de-duplicated by product id, first category seen wins.',
      stoppedEarly ? `Stopped at the ${MAX_MINUTES}-minute budget — dataset is partial.` : 'Completed all configured categories.',
    ],
  })
  console.log(`[${STORE_ID}] done: ${lines.length} records total (${writer.count - startCount} new), ${pagesFetched} pages, ${failures.length} failed pages${stoppedEarly ? ', STOPPED EARLY' : ''}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
