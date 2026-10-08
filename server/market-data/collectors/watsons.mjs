/**
 * Watsons Saudi (watsons.sa) collector.
 *
 * Method: watsons.sa is a Shopify storefront. Shopify publishes the catalog as public JSON:
 *  - /products.json?limit=250&page=N  → title, vendor (brand), product_type, tags, variants
 *    (price, compare_at_price, sku, available, option values)
 *  - /products/<handle>.js            → same product incl. variant "barcode" (EAN), price in halalas
 * Phase 1 pages the whole catalog (~30 requests). Phase 2 fetches <handle>.js only for products
 * that have a priced variant, to read public barcodes, within a time budget (--barcode-min, default 60).
 * Products whose every variant shows price 0.00 are not purchasable (no price on the page) and are skipped.
 * Category = Watsons' own category tag (watsons_<top>_...) top level + Shopify product_type.
 *
 * Usage: node collectors/watsons.mjs [--limit N] [--barcode-min M] [--no-barcode]
 */
import fs from 'node:fs'
import { politeFetch } from '../lib/http.mjs'
import { RecordWriter, writeReport, parseSize, parsePrice, normalizeBarcode, hasArabic, splitArEn } from '../lib/record.mjs'

const STORE_ID = 'watsons'
const STORE_NAME = 'Watsons'
const BASE = 'https://www.watsons.sa'

const args = process.argv.slice(2)
const argVal = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d)
const LIMIT = args.includes('--limit') ? parseInt(argVal('--limit'), 10) : Infinity
const BARCODE_MIN = parseFloat(argVal('--barcode-min', '60'))
const NO_BARCODE = args.includes('--no-barcode')

const TOP = { makeup: 'Makeup', skincare: 'Skin Care', haircare: 'Hair Care', fragrances: 'Fragrance', personal: 'Personal Care', men: "Men's Grooming", mens: "Men's Grooming", bodycare: 'Body Care' }

// Non-beauty items to exclude (oral care, health, household)
const EXCLUDE_TAG = /^watsons_personal_care_(mouthwash|oral|tongue|toothbrush|toothpaste|health|floss|denture)/i
const EXCLUDE_TYPE = /tooth|mouth ?wash|oral|dental|floss|healthcare|room fragrance|vitamin|supplement|medical|condom|pregnancy|^water$|contact lens|sanitary|tampon|panty liner|surgical|sanitiser|sanitizer|^candle$/i

function categoryOf(p) {
  const tag = p.tags.find((t) => t.startsWith('watsons_') && t !== 'watsons_holding')
  let top = null
  if (tag) {
    const k = tag.split('_')[1]
    top = TOP[k] ?? k.charAt(0).toUpperCase() + k.slice(1)
  }
  const type = p.product_type?.trim() || null
  return [top, type].filter(Boolean).join(' > ') || null
}

function excluded(p) {
  if (p.tags.some((t) => EXCLUDE_TAG.test(t))) return true
  if (p.product_type && EXCLUDE_TYPE.test(p.product_type.trim())) return true
  return false
}

async function main() {
  const t0 = Date.now()
  const writer = new RecordWriter(STORE_ID)
  const notes = []

  // Phase 1: full catalog listing
  const products = []
  for (let page = 1; page < 200; page++) {
    const r = await politeFetch(`${BASE}/products.json?limit=250&page=${page}`, { json: true, delayMs: 1200, cache: false })
    if (!r.ok) throw new Error(`products.json page ${page}: ${r.status}`)
    const list = r.data.products ?? []
    products.push(...list)
    console.log(`page ${page}: ${list.length} (total ${products.length})`)
    if (list.length < 250) break
    if (products.length >= LIMIT * 3) break
  }

  let excludedCount = 0
  let unpriced = 0
  const inScope = []
  for (const p of products) {
    if (excluded(p)) {
      excludedCount++
      continue
    }
    const priced = p.variants.filter((v) => parsePrice(v.price) !== null)
    if (!priced.length) {
      unpriced++
      continue
    }
    inScope.push(p)
  }
  console.log(`catalog ${products.length}, excluded non-beauty ${excludedCount}, unpriced ${unpriced}, in scope ${inScope.length}`)
  const toWrite = inScope.slice(0, LIMIT === Infinity ? undefined : LIMIT)

  // Phase 2: barcodes from /products/<handle>.js (public), time-boxed
  const barcodes = new Map() // variantId -> barcode
  let jsFetched = 0
  let jsSkipped = 0
  if (!NO_BARCODE) {
    const deadline = Date.now() + BARCODE_MIN * 60_000
    // in-stock products first, so the time budget is spent on the most relevant items
    const order = [...toWrite].sort((a, b) => Number(b.variants.some((v) => v.available)) - Number(a.variants.some((v) => v.available)))
    for (const p of order) {
      if (Date.now() > deadline) {
        jsSkipped++
        continue
      }
      const r = await politeFetch(`${BASE}/products/${p.handle}.js`, { json: true, delayMs: 1100, cache: true })
      jsFetched++
      if (r.ok) for (const v of r.data.variants ?? []) if (v.barcode) barcodes.set(String(v.id), v.barcode)
      if (jsFetched % 200 === 0) console.log(`  barcode lookups: ${jsFetched}/${toWrite.length}`)
    }
    if (jsSkipped) notes.push(`Barcode lookup time budget (${BARCODE_MIN} min) reached: ${jsSkipped} products written without barcode lookup.`)
  }

  const categories = new Set()
  for (const p of toWrite) {
    const category = categoryOf(p)
    if (category) categories.add(category)
    const multi = p.variants.length > 1
    const sizeOpt = p.options?.findIndex((o) => /size|volume|حجم/i.test(o.name))
    const imgDefault = p.images?.[0]?.src ?? null
    for (const v of p.variants) {
      const vt = v.title && v.title !== 'Default Title' ? v.title : null
      const optSize = sizeOpt >= 0 ? v[`option${sizeOpt + 1}`] : null
      const size = optSize && parseSize(optSize) ? optSize : parseSize(p.title)?.text ?? (vt ? parseSize(vt)?.text ?? null : null)
      const name = p.title
      const sp = hasArabic(name) ? splitArEn(name) : { en: name, ar: null }
      const variant = vt && vt !== size ? vt : null
      writer.write({
        storeName: STORE_NAME,
        url: multi ? `${BASE}/products/${p.handle}?variant=${v.id}` : `${BASE}/products/${p.handle}`,
        storeProductId: String(v.id),
        name: vt && multi ? `${name} - ${vt}` : name,
        nameEn: sp.en,
        nameAr: sp.ar,
        brand: p.vendor || null,
        category,
        variant,
        size,
        barcode: normalizeBarcode(barcodes.get(String(v.id))),
        sku: v.sku || null,
        price: v.price,
        originalPrice: v.compare_at_price,
        inStock: typeof v.available === 'boolean' ? v.available : null,
        imageUrl: v.featured_image?.src ?? imgDefault,
      })
    }
  }

  const all = fs.readFileSync(writer.file, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l))
  const cnt = (f) => all.filter(f).length
  notes.push(
    'Source: Shopify public storefront JSON (/products.json listing + /products/<handle>.js for variant barcodes).',
    `Catalog ${products.length} products; ${excludedCount} non-beauty (oral care/health/room fragrance) excluded; ${unpriced} products with only 0.00-priced variants skipped (not purchasable, no price shown).`,
    'One record per variant (shade/size). /ar/ locale returns untranslated English titles, so nameAr is null unless the title itself is Arabic.',
    'sku = Watsons article code (ASW...). Prices are SAR as displayed (VAT-inclusive); originalPrice = compare_at_price.',
    `Barcode lookups: ${jsFetched}. Run time ${Math.round((Date.now() - t0) / 1000)}s.`
  )
  writeReport(STORE_ID, {
    storeName: STORE_NAME,
    baseUrl: BASE,
    method: 'public storefront JSON API (Shopify products.json + product .js)',
    categoriesCovered: [...categories].sort(),
    recordsWritten: all.length,
    recordsRejected: writer.rejected,
    withBarcode: cnt((r) => r.barcode),
    withBrand: cnt((r) => r.brand),
    withSize: cnt((r) => r.size),
    withOriginalPrice: cnt((r) => r.originalPrice),
    inStockTrue: cnt((r) => r.inStock === true),
    blocked: false,
    notes: notes.join(' '),
  })
  console.log(`done: ${all.length} records, rejected ${writer.rejected}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
