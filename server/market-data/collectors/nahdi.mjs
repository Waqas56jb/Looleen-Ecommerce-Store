/**
 * Nahdi Online (KSA) collector — beauty & personal-care categories only.
 *
 * Method: the nahdionline.com storefront (Next.js) queries Algolia directly from the
 * browser with a public, search-only API key that ships in its client JS bundle
 * (app H9X4IH7M99, indexes prod_en_products / prod_ar_products). We call that same
 * public search endpoint, filtered by the store's own category facets, 1000 hits/request.
 * Hits expose: name, manufacturer (brand), SAR price + original price, SKU, url key, image.
 * Barcodes and stock are not exposed in the public hits (nor in product-page JSON-LD), so
 * barcode/inStock stay null.
 *
 * Usage: node collectors/nahdi.mjs [--limit N]
 */
import { politeFetch } from '../lib/http.mjs'
import fs from 'node:fs'
import { RecordWriter, writeReport, parseSize, parsePrice } from '../lib/record.mjs'

const STORE_ID = 'nahdi'
const STORE_NAME = 'Nahdi Online'
const BASE = 'https://www.nahdionline.com'
const APP = 'H9X4IH7M99'
const KEY = '2bbce1340a1cab2ccebe0307b1310881' // public search-only key from the storefront bundle
const IDX_EN = 'prod_en_products'
const IDX_AR = 'prod_ar_products'
const HPP = 1000

const args = process.argv.slice(2)
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity

// Top-level categories in scope, with level1 sub-categories to EXCLUDE (non-beauty).
// For level0 entries with `only`, just those level1 values are collected.
const SCOPE = [
  { l0: 'Skin Care' },
  { l0: 'Hair Care', exclude: ['Lice Treatment'] },
  { l0: 'Fragrances' },
  { l0: 'Makeup' },
  { l0: 'Bath & Body' },
  { l0: 'Beauty Accessories', exclude: ['Subha', 'Keychain'] },
  { l0: 'Men Care', exclude: ['Sexual Care'] },
  { l0: 'Lady Care', only: ['Hair Removals'] },
  { l0: 'Baby Care', only: ['Baby Bathing & Skin Care'] },
  { l0: 'Kids Care', only: ['Kids Bathing & Skin Care', 'Kids Hair Care'] },
  { l0: 'Mother Care', only: ['Mom Skin Care'] },
]

async function query(index, params) {
  const r = await politeFetch(`https://${APP}-dsn.algolia.net/1/indexes/${index}/query`, {
    method: 'POST',
    json: true,
    delayMs: 1200,
    cache: false, // prices change; always read live
    headers: { 'X-Algolia-API-Key': KEY, 'X-Algolia-Application-Id': APP, 'content-type': 'application/json' },
    body: JSON.stringify({ params: new URLSearchParams(params).toString() }),
  })
  if (!r.ok) throw new Error(`Algolia ${index} ${r.status}: ${String(JSON.stringify(r.data)).slice(0, 200)}`)
  return r.data
}

// The search key only lets a query page through its first 4000 hits, so larger result
// sets are split into SAR price bands until each band fits.
const MAX_REACHABLE = 4000
const BANDS = [0, 10, 20, 30, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300, 400, 500, 700, 1000, 1500, 100000]
const capWarnings = []

async function* pages(index, filters) {
  for (let page = 0; ; page++) {
    const d = await query(index, { filters, hitsPerPage: String(HPP), page: String(page) })
    for (const h of d.hits) yield h
    if (page + 1 >= d.nbPages || !d.hits.length || (page + 1) * HPP >= MAX_REACHABLE) break
  }
}

async function* allHits(index, filters) {
  const head = await query(index, { filters, hitsPerPage: '0' })
  if (head.nbHits <= MAX_REACHABLE) {
    yield* pages(index, filters)
    return
  }
  for (let i = 0; i < BANDS.length - 1; i++) {
    const f = `${filters ? `${filters} AND ` : ''}price.SAR.default >= ${BANDS[i]} AND price.SAR.default < ${BANDS[i + 1]}`
    const h2 = await query(index, { filters: f, hitsPerPage: '0' })
    if (!h2.nbHits) continue
    if (h2.nbHits > MAX_REACHABLE) capWarnings.push(`${f}: ${h2.nbHits} hits, only first ${MAX_REACHABLE} reachable`)
    yield* pages(index, f)
  }
}

const q = (s) => `"${s.replace(/"/g, '\\"')}"`

function urlKey(h) {
  try {
    const p = new URL(h.url).pathname.replace(/^\/(en|ar)\//, '').replace(/\/$/, '')
    return p || null
  } catch {
    return null
  }
}

function originalOf(sar) {
  const o = parsePrice(sar?.default_original_formated)
  const p = parsePrice(sar?.default)
  return o && p && o > p ? o : null
}

async function main() {
  const t0 = Date.now()
  const writer = new RecordWriter(STORE_ID)
  const startCount = writer.count
  const notes = []

  // 1) level1 facet values per in-scope level0
  const facetQ = { hitsPerPage: '0', facets: JSON.stringify(['categories.level0', 'categories.level1']), maxValuesPerFacet: '1000' }
  const facets = await query(IDX_EN, facetQ)
  const l1all = Object.keys(facets.facets?.['categories.level1'] ?? {})

  // 2) English pass → memory (objectID → { hit, category })
  const found = new Map()
  const categoriesCovered = []
  const take = (h, category) => {
    if (!found.has(h.objectID)) found.set(h.objectID, { h, category })
  }
  outer: for (const s of SCOPE) {
    const subs = l1all
      .filter((v) => v.startsWith(s.l0 + ' /// '))
      .map((v) => v.split(' /// ')[1])
      .filter((sub) => (s.only ? s.only.includes(sub) : !(s.exclude ?? []).includes(sub)))
    for (const sub of subs) {
      const category = `${s.l0} > ${sub}`
      let n = 0
      for await (const h of allHits(IDX_EN, `categories.level1:${q(`${s.l0} /// ${sub}`)}`)) {
        take(h, category)
        n++
        if (found.size >= LIMIT) break outer
      }
      categoriesCovered.push(category)
      console.log(`${category}: ${n} hits, unique so far ${found.size}`)
    }
    // products tagged only at level0 (no level1)
    if (!s.only) {
      const excl = (s.exclude ?? []).map((x) => ` AND NOT categories.level1:${q(`${s.l0} /// ${x}`)}`).join('')
      let n = 0
      const before = found.size
      for await (const h of allHits(IDX_EN, `categories.level0:${q(s.l0)}${excl}`)) {
        take(h, s.l0)
        n++
        if (found.size >= LIMIT) break outer
      }
      console.log(`${s.l0} (level0 sweep): ${n} hits, +${found.size - before} new, unique ${found.size}`)
    }
  }

  // 3) Arabic names. Facet values are localized; map each in-scope English level0 to the Arabic
  //    level0 with the identical product count, then read all Arabic level1 lists under it.
  const arName = new Map()
  if (LIMIT === Infinity) {
    const arFacets = await query(IDX_AR, facetQ)
    const en0 = facets.facets['categories.level0']
    const ar0 = arFacets.facets['categories.level0']
    const ar1 = Object.keys(arFacets.facets['categories.level1'] ?? {})
    for (const s of SCOPE) {
      const cands = Object.keys(ar0).filter((k) => ar0[k] === en0[s.l0])
      if (cands.length !== 1) {
        notes.push(`Arabic level0 for "${s.l0}" ambiguous/unmatched by count; Arabic names may be missing there.`)
        continue
      }
      for (const v of ar1.filter((x) => x.startsWith(cands[0] + ' /// '))) {
        for await (const h of allHits(IDX_AR, `categories.level1:${q(v)}`)) if (found.has(h.objectID)) arName.set(h.objectID, h.name)
      }
      for await (const h of allHits(IDX_AR, `categories.level0:${q(cands[0])}`)) if (found.has(h.objectID)) arName.set(h.objectID, h.name)
      console.log(`arabic ${s.l0} → ${cands[0]}: names so far ${arName.size}`)
    }
  } else notes.push('Test run (--limit): Arabic names not loaded.')

  let written = 0
  let rejectedNoPrice = 0
  const stats = { brand: 0, size: 0, orig: 0, ar: 0 }

  const handle = (h, category) => {
    const key = urlKey(h)
    const sku = h.sku ? String(h.sku) : null
    if (!key || !sku) return
    const sar = h.price?.SAR
    const name = h.name
    const sz = parseSize(name)
    const rec = {
      storeName: STORE_NAME,
      url: `${BASE}/en-sa/${key}/pdp/${sku}`,
      storeProductId: sku,
      name,
      nameEn: name,
      nameAr: arName.get(h.objectID) ?? null,
      brand: h.manufacturer || null,
      category,
      variant: null,
      size: sz?.text ?? null,
      barcode: null,
      sku,
      price: sar?.default,
      originalPrice: originalOf(sar),
      inStock: null,
      imageUrl: h.image_url ? h.image_url.split('?')[0] : null,
    }
    if (parsePrice(rec.price) === null) rejectedNoPrice++
    if (writer.write(rec)) {
      written++
      if (rec.brand) stats.brand++
      if (rec.size) stats.size++
      if (rec.originalPrice) stats.orig++
      if (rec.nameAr) stats.ar++
    }
  }

  for (const { h, category } of found.values()) handle(h, category)
  if (capWarnings.length) notes.push('Pagination cap warnings: ' + capWarnings.join('; '))

  notes.push(
    'Source: the storefront\'s public Algolia search endpoint (search-only key published in the site JS bundle); same data the PLP pages render.',
    'Scope: Makeup, Skin Care, Fragrances, Hair Care (excl. lice treatment), Bath & Body, Beauty Accessories (excl. subha/keychains), Men Care (excl. sexual care), Lady Care > Hair Removals, Baby/Kids bathing & skin/hair care, Mom Skin Care. Vitamins, medicines, devices, oral care excluded.',
    'Barcodes are not public (not in hits nor product JSON-LD); sku = Nahdi 9-digit SKU. Stock status not exposed in listing data → inStock null.',
    'Products listed in several categories are kept once under the first category encountered.',
    'Size parsed from the product name. Price = price.SAR.default (VAT-inclusive, matches PDP); originalPrice from default_original_formated when higher.',
    `Run time ${Math.round((Date.now() - t0) / 1000)}s.`
  )
  const total = writer.count
  // coverage over the whole file (works across resumed runs)
  const all = fs.readFileSync(writer.file, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l))
  const cnt = (f) => all.filter(f).length
  Object.assign(stats, { brand: cnt((r) => r.brand), size: cnt((r) => r.size), orig: cnt((r) => r.originalPrice), ar: cnt((r) => r.nameAr) })
  writeReport(STORE_ID, {
    storeName: STORE_NAME,
    baseUrl: BASE + '/ar-sa',
    method: 'public storefront search API (Algolia, public search-only key) by category facets',
    categoriesCovered,
    recordsWritten: total,
    recordsWrittenThisRun: written,
    recordsRejected: writer.rejected,
    rejectedNoPrice,
    withBarcode: 0,
    withBrand: stats.brand,
    withSize: stats.size,
    withOriginalPrice: stats.orig,
    withNameAr: stats.ar,
    blocked: false,
    notes: notes.join(' '),
  })
  console.log(`done: ${written} written this run (${total} total), rejected ${writer.rejected}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
