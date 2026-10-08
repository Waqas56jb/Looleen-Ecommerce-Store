/**
 * Whites pharmacy (whites.sa) — beauty & personal-care price collector.
 *
 * Whites runs on Akinon (Next.js storefront). Method:
 *  - Category tree discovery: public storefront JSON  /ar-sa/<category>/?format=json  (facets + counts).
 *  - Product listings: public category pages /<locale>/<category>/?page_size=250 (max 250 per page),
 *    and /<locale>/<category>/?page=N for the rare leaf category with more than 250 items.
 *    The listing HTML embeds the storefront's product JSON (Next.js RSC payload); we read
 *    factual fields from it (name, brand, GTIN, size, SKU, price, retail price, stock, URL, image URL).
 *  - robots.txt disallows any URL containing "&" (and search/sorter/facet params), so every URL
 *    we request has exactly one query parameter. politeFetch enforces robots.txt.
 *  - Each listing page is fetched in ar-sa (primary, Arabic names) and en-sa (English names): 1 extra call per page.
 *
 * Usage: node collectors/whites.mjs [--limit N]
 */
import { politeFetch } from '../lib/http.mjs'
import { RecordWriter, writeReport, parseSize } from '../lib/record.mjs'

const STORE_ID = 'whites'
const STORE_NAME = 'Whites'
const BASE = 'https://www.whites.sa'
const PAGE_MAX = 250
const SMALL_PAGE = 20
const HTML_DELAY = 1600
const JSON_DELAY = 1500

const args = process.argv.slice(2)
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity

// Beauty & personal-care roots only (no medicine, supplements, health care, foods, diapers, feeding, oral/feminine care)
const ROOTS = [
  'skin-care',
  'make-up',
  'hair-care',
  'fragrances',
  'bath-shower-spa',
  'body-care',
  'men-s-grooming',
  'foot-care',
  'baby-bathing-essentials',
  'baby-skin-care',
]

/* ---------------- RSC payload parsing ---------------- */

function rscText(html) {
  let s = ''
  const re = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g
  let m
  while ((m = re.exec(html))) {
    try {
      s += JSON.parse(m[1])
    } catch {
      /* ignore malformed chunk */
    }
  }
  return s
}

function grabBalanced(s, i) {
  let d = 0
  let inS = false
  for (let j = i; j < s.length; j++) {
    const c = s[j]
    if (inS) {
      if (c === '\\') j++
      else if (c === '"') inS = false
      continue
    }
    if (c === '"') inS = true
    else if (c === '[' || c === '{') d++
    else if (c === ']' || c === '}') {
      d--
      if (!d) return s.slice(i, j + 1)
    }
  }
  return null
}

/** Returns { products: [], pagination } from a listing page's HTML */
function parseListing(html) {
  const s = rscText(html)
  const pi = s.indexOf('"pagination":{"current_page"')
  let pagination = null
  if (pi >= 0) {
    try {
      pagination = JSON.parse(grabBalanced(s, pi + '"pagination":'.length))
    } catch {
      pagination = null
    }
  }
  // the listing's products array follows the pagination/facets block
  let idx = s.indexOf('"products":[', Math.max(0, pi))
  if (idx < 0) idx = s.indexOf('"products":[')
  let products = []
  if (idx >= 0) {
    try {
      products = JSON.parse(grabBalanced(s, idx + '"products":'.length))
    } catch {
      products = []
    }
  }
  return { products: Array.isArray(products) ? products : [], pagination }
}

const str = (v) => (typeof v === 'string' && v && !v.startsWith('$') ? v : null)

/* ---------------- category tree ---------------- */

async function categoryInfo(slug) {
  const r = await politeFetch(`${BASE}/ar-sa/${slug}/?format=json`, { json: true, delayMs: JSON_DELAY })
  if (!r.ok) return null
  const choices = r.data.facets?.find((f) => f.key === 'category_ids')?.data?.choices ?? []
  const selIdx = choices.findIndex((c) => c.is_selected)
  const children = []
  if (selIdx >= 0) {
    const d = choices[selIdx].depth
    for (let i = selIdx + 1; i < choices.length && choices[i].depth > d; i++) {
      if (choices[i].depth === d + 1) {
        const m = String(choices[i].url).match(/^\/([^/?]+)\//)
        if (m) children.push({ slug: m[1], label: choices[i].label, count: choices[i].quantity })
      }
    }
  }
  return { slug, label: r.data.category?.name ?? slug, count: r.data.pagination?.total_count ?? 0, children }
}

/** Resolve roots into fetch plans: categories with <=250 items, or big leaves to paginate */
async function buildPlan() {
  const plan = []
  const visit = async (slug, pathLabels) => {
    const info = await categoryInfo(slug)
    if (!info) {
      console.warn('category info failed', slug)
      return
    }
    const labels = [...pathLabels, info.label]
    if (info.count <= PAGE_MAX || !info.children.length) {
      plan.push({ slug, labels, count: info.count })
      return
    }
    for (const c of info.children) await visit(c.slug, labels)
  }
  for (const root of ROOTS) await visit(root, [])
  return plan
}

/* ---------------- listing fetch ---------------- */

async function fetchListing(locale, slug, query) {
  const r = await politeFetch(`${BASE}/${locale}/${slug}/?${query}`, { delayMs: HTML_DELAY })
  if (!r.ok) {
    console.warn('listing failed', locale, slug, query, r.status)
    return { products: [], pagination: null }
  }
  return parseListing(r.data)
}

/** All query strings needed to cover a category (single param each, robots-compliant) */
function queriesFor(count) {
  const qs = [`page_size=${PAGE_MAX}`]
  if (count > PAGE_MAX) {
    // page N (20/page) covers items (N-1)*20+1 .. N*20; start where the 250-page ends
    const first = Math.floor(PAGE_MAX / SMALL_PAGE) + 1
    const last = Math.ceil(count / SMALL_PAGE)
    for (let p = first; p <= last; p++) qs.push(`page=${p}`)
  }
  return qs
}

/* ---------------- main ---------------- */

const writer = new RecordWriter(STORE_ID)
const startCount = writer.count
let withBarcode = 0
let withBrand = 0
let withSize = 0
let withOriginal = 0
let written = 0
const categoriesCovered = new Set()
const coverage = []

function toRecord(p, enName, labels) {
  const a = p.attributes && typeof p.attributes === 'object' ? p.attributes : {}
  const catAttr = [str(a.category_1), str(a.category_2), str(a.category_3)].filter(Boolean)
  const category = catAttr.length ? catAttr.join(' > ') : labels.join(' > ')
  const nameAr = str(p.name)
  const size = str(a.Size) || parseSize(enName)?.text || parseSize(nameAr)?.text || null
  const img = Array.isArray(p.productimage_set) ? p.productimage_set.find((i) => i && str(i.image))?.image : null
  const url = str(p.absolute_url) ? `${BASE}/ar-sa${p.absolute_url}` : null
  const inStock = p.in_stock === true || p.in_stock === 'true' ? true : p.in_stock === false || p.in_stock === 'false' ? false : null
  return {
    storeName: STORE_NAME,
    url,
    storeProductId: p.pk,
    name: nameAr || enName,
    nameAr,
    nameEn: enName || null,
    brand: str(a.Brand),
    category,
    variant: null,
    size,
    barcode: str(a.GTIN),
    sku: str(p.sku),
    price: p.price,
    originalPrice: p.retail_price,
    inStock,
    imageUrl: img ?? null,
  }
}

const plan = await buildPlan()
console.log(`plan: ${plan.length} categories, ~${plan.reduce((s, p) => s + p.count, 0)} listings`)

outer: for (const cat of plan) {
  const seenHere = new Set()
  for (const q of queriesFor(cat.count)) {
    const ar = await fetchListing('ar-sa', cat.slug, q)
    if (!ar.products.length) continue
    const en = await fetchListing('en-sa', cat.slug, q)
    const enNames = new Map(en.products.map((p) => [String(p.pk), str(p.name)]))
    for (const p of ar.products) {
      if (!p || p.pk === undefined) continue
      seenHere.add(String(p.pk))
      const rec = toRecord(p, enNames.get(String(p.pk)) ?? null, cat.labels)
      if (writer.write(rec)) {
        written++
        categoriesCovered.add(rec.category.split(' > ')[0])
        if (rec.barcode) withBarcode++
        if (rec.brand) withBrand++
        if (rec.size) withSize++
        if (rec.originalPrice && Number(rec.originalPrice) > Number(rec.price)) withOriginal++
        if (written >= LIMIT) break outer
      }
    }
  }
  coverage.push({ category: cat.labels.join(' > '), expected: cat.count, seen: seenHere.size })
  console.log(`${cat.labels.join(' > ')}: ${seenHere.size}/${cat.count} | total written ${written}`)
}

writeReport(STORE_ID, {
  storeName: STORE_NAME,
  baseUrl: `${BASE}/ar-sa`,
  method:
    'public storefront category listings (Akinon/Next.js): tree via /<category>/?format=json, products from the product JSON embedded in /<locale>/<category>/?page_size=250 (and ?page=N for big leaves); ar-sa + en-sa for bilingual names; robots.txt respected (single-param URLs only)',
  categoriesCovered: [...categoriesCovered],
  recordsWritten: writer.count,
  recordsWrittenThisRun: written,
  recordsRejected: writer.rejected,
  withBarcode,
  withBrand,
  withSize,
  withOriginalPrice: withOriginal,
  blocked: false,
  coverage,
  notes:
    'Included: Skin Care, Make Up, Hair Care (incl. hair tools & devices), Fragrances, Personal Care > Bath/Shower/Spa, Body Care, Men\'s Grooming, Foot Care, Mother & Baby > Baby Bathing Essentials, Baby Skin Care. Excluded: medicine, vitamins/supplements, health care, healthy foods, oral care, feminine care, home essentials, diapering, feeding. price = displayed selling price, originalPrice = retail_price when higher. Field counts (withBarcode etc.) refer to records written in this run.' +
    (startCount ? ` Resumed run: ${startCount} records existed before.` : ''),
})
console.log(`done: ${written} new, ${writer.count} total, rejected ${writer.rejected}`)
