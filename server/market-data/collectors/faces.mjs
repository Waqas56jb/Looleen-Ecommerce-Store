/**
 * Faces (faces.sa, Chalhoub) — Saudi beauty retailer on Salesforce Commerce Cloud.
 *
 * Method (all public, robots.txt respected via politeFetch):
 *  1. Catalog discovery: the storefront's own public Constructor.io search/browse API
 *     (ac.cnstrc.com, public client key embedded in every faces.sa page as window.cnstrc.indexKey).
 *     Gives the full list of product ids per beauty category + their category/brand group ids.
 *     Its "price" is a list price and is NOT used as the selling price.
 *  2. Prices: public category / brand listing pages (/en/<category>, /en/brands/<brand>, first page of 48,
 *     plus the ?srule= price-sorted views the page itself links to). Each product tile carries the
 *     displayed price, struck-through price, brand, size, stock flag and category path.
 *     Pagination endpoints (Search-UpdateGrid, &sz=) are disallowed by robots.txt and are NOT used;
 *     a greedy set-cover over categories + brands is used instead to reach (almost) every product.
 *  3. Product pages (/en/p/...html) for (a) products not seen in any listing and (b) multi-size
 *     products ("from" price on tile) to get the per-size prices shown on the page and the public EAN.
 *
 * Usage: node collectors/faces.mjs [--limit N] [--max-minutes 85]
 */
import { politeFetch } from '../lib/http.mjs'
import { RecordWriter, writeReport, parseSize } from '../lib/record.mjs'

const STORE_ID = 'faces'
const STORE_NAME = 'Faces'
const BASE = 'https://www.faces.sa'
const CNSTRC_KEY = 'key_9BQUmfGc85lgiW0t' // public storefront key (window.cnstrc.indexKey on faces.sa)
const CNSTRC = 'https://ac.cnstrc.com'
const ROOTS = ['perfume', 'skincare', 'makeup', 'men-beauty-products', 'haircare', 'bodycare', 'suncare']
const ROOT_LABEL = { perfume: 'Fragrance', skincare: 'Skin Care', makeup: 'Makeup', 'men-beauty-products': "Men's Grooming", haircare: 'Hair Care', bodycare: 'Body Care', suncare: 'Sun Care' }
// non-beauty groups / product categories to exclude
const EXCLUDE_GROUP = /vitamin|supplement|candle|diffuser|home-fragrance|home-scent|gift-?card|giftwrap|sample|test/i
const EXCLUDE_CAT = /vitamin|supplement|candle|diffuser|home fragrance|home scent|gift card|gift wrap/i

const args = process.argv.slice(2)
const argVal = (name, d) => {
  const i = args.indexOf(name)
  return i >= 0 ? Number(args[i + 1]) : d
}
const LIMIT = argVal('--limit', Infinity)
const DEADLINE = Date.now() + argVal('--max-minutes', 85) * 60_000
const MAX_LISTING_PAGES = LIMIT < Infinity ? 3 : 700
const HTML_DELAY = 1500
const API_DELAY = 1000

const writer = new RecordWriter(STORE_ID)
const startCount = writer.count
const stats = { listingPages: 0, pdpPages: 0, pdpFailed: 0, excluded: 0, rangeFallback: 0, listingFailed: 0 }
const categoriesCovered = new Set()
const notes = []
const done = () => writer.count - startCount >= LIMIT
const timeUp = () => Date.now() > DEADLINE

/* ---------------- helpers ---------------- */
const NAMED = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', hellip: '…', ocirc: 'ô', Ocirc: 'Ô', egrave: 'è', eacute: 'é', Eacute: 'É', igrave: 'ì', agrave: 'à', aacute: 'á', ccedil: 'ç', uuml: 'ü', ouml: 'ö', auml: 'ä', deg: '°', times: '×', copy: '©', reg: '®', trade: '™', ndash: '–', mdash: '—', lrm: '', rlm: '' }
const MARKS = { acute: '́', grave: '̀', circ: '̂', uml: '̈', tilde: '̃', ring: '̊', cedil: '̧' }
/** generic Latin accented entities: &eacute; &Acirc; &iuml; &yuml; ... */
function ACCENT(n) {
  const m = n.match(/^([a-zA-Z])(acute|grave|circ|uml|tilde|ring|cedil)$/)
  if (m) return (m[1] + MARKS[m[2]]).normalize('NFC')
  return { szlig: 'ß', oelig: 'œ', OElig: 'Œ', aelig: 'æ', AElig: 'Æ', oslash: 'ø', Oslash: 'Ø' }[n] ?? null
}
function decode(s) {
  if (s == null) return s
  let out = String(s)
  for (let k = 0; k < 2; k++)
    out = out
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
      .replace(/&([a-z]+);/gi, (m, n) => (n in NAMED ? NAMED[n] : ACCENT(n) ?? m))
  return out.replace(/[⁦-⁩‎‏]/g, '').trim()
}
/** numbers in a price snippet, after removing entities (the riyal sign is &#8385;) */
function pricesIn(snippet) {
  const t = snippet.replace(/&#x?[0-9a-f]+;|&[a-z]+;/gi, ' ').replace(/<[^>]+>/g, ' ')
  return [...t.matchAll(/(\d[\d,]*(?:\.\d+)?)/g)].map((m) => parseFloat(m[1].replace(/,/g, ''))).filter((n) => n > 0)
}
const catPath = (g) => [g.item_category, g.item_category2, g.item_category3, g.item_category4, g.item_category5].map(decode).filter(Boolean).join(' > ') || null
const cleanSize = (s) => {
  if (!s) return null
  const t = decode(String(s)).replace(/^'+/, '').trim()
  return t && t.toLowerCase() !== 'null' ? t : null
}
const abs = (u) => (u.startsWith('http') ? u : BASE + u)

/* ---------------- 1. catalog discovery via Constructor ---------------- */
async function cn(path) {
  const sep = path.includes('?') ? '&' : '?'
  const r = await politeFetch(`${CNSTRC}${path}${sep}key=${CNSTRC_KEY}&c=ciojs-client-2.0`, { json: true, delayMs: API_DELAY })
  if (!r.ok) throw new Error(`constructor ${path} -> ${r.status}`)
  return r.data
}

const universe = new Map() // masterId -> { id, name, url, groups:Set, root }
const groupInfo = new Map() // gid -> { gid, name, count, kind:'cat'|'brand', path }

async function discover() {
  const tree = await cn('/browse/groups?fmt_options%5Bgroups_max_depth%5D=6')
  const top = (tree.groups || tree.response?.groups)[0].children
  const walk = (n, kind, path) => {
    const p = path ? `${path} > ${decode(n.display_name)}` : decode(n.display_name)
    if (!EXCLUDE_GROUP.test(n.group_id)) groupInfo.set(n.group_id, { gid: n.group_id, name: decode(n.display_name), count: n.count, kind, path: p })
    for (const c of n.children || []) walk(c, kind, p)
  }
  for (const r of top) {
    if (ROOTS.includes(r.group_id)) walk(r, 'cat', '')
    if (r.group_id === 'all_brands') for (const letter of r.children || []) for (const b of letter.children || []) walk(b, 'brand', 'Brands')
  }
  for (const root of ROOTS) {
    for (let page = 1; ; page++) {
      const d = await cn(`/browse/group_id/${root}?num_results_per_page=200&page=${page}`)
      const res = d.response.results
      for (const x of res) {
        const id = x.data.id
        let u = universe.get(id)
        if (!u) {
          const file = (x.data.url || '').split('/p/')[1]
          u = { id, name: decode(x.value), url: file ? `${BASE}/en/p/${file}` : null, groups: new Set(), root }
          universe.set(id, u)
        }
        for (const g of x.data.group_ids || []) u.groups.add(g)
      }
      if (!res.length || page * 200 >= d.response.total_num_results) break
    }
  }
  console.log(`discovered ${universe.size} products, ${groupInfo.size} groups`)
}

/* ---------------- 2. listing pages ---------------- */
const covered = new Set() // master ids written or queued
const pdpQueue = new Map() // masterId -> { url, tile } (tile is a fallback record for range products)

function parseTiles(html) {
  const tiles = []
  const parts = html.split(/(?=data-gtm-enhancedecommerce-list=")/).slice(1)
  for (const p of parts) {
    let g
    try {
      g = JSON.parse(decode(p.match(/^data-gtm-enhancedecommerce-list="([^"]*)"/)[1]).replace(/^﻿/, ''))[0]
    } catch {
      continue
    }
    if (!g?.item_id) continue
    const end = p.indexOf('END_dwmarker')
    const body = end > 0 ? p.slice(0, end) : p.slice(0, 40000)
    const href = body.match(/href="(\/en\/p\/[^"]+)"/)?.[1]
    const priceBlock = body.match(/class="product-tile-pricing[\s\S]*?(?=js-quickview-overlay|$)/)?.[0] || ''
    const sale = priceBlock.match(/price-on-sale[^>]*>\s*<span class="value"[^>]*content="([\d.]+)"/)?.[1]
    const strike = priceBlock.match(/strike-through[^>]*>\s*<span class="value"[^>]*content="([\d.]+)"/)?.[1]
    const first = priceBlock.match(/<span class="value"[^>]*content="([\d.]+)"/)?.[1]
    const range = /js-price-range/.test(priceBlock)
    const img = body.match(/<img[^>]*class="picture-img tile-image[^"]*"[\s\S]*?src="([^"]+)"/)?.[1]
    tiles.push({ g, href, price: sale ? +sale : first ? +first : null, originalPrice: sale && strike ? +strike : null, range, img: img ? decode(img) : null })
  }
  return tiles
}

function tileToRecord(t, fallbackCat) {
  const g = t.g
  const category = catPath(g) || fallbackCat
  const size = t.range ? null : cleanSize(g.item_size)
  const name = decode(g.item_name)
  return {
    storeName: STORE_NAME,
    url: t.href ? abs(t.href) : null,
    storeProductId: decode(g.item_id),
    name,
    nameEn: name.replace(/\s+/g, ' '),
    nameAr: null,
    brand: decode(g.item_brand) || null,
    category,
    variant: t.range ? null : decode(g.item_color) || null,
    size: size || parseSize(name)?.text || null,
    barcode: null, // listing tiles expose only the internal 12-digit variant code
    sku: t.range ? null : g.item_variant ? String(g.item_variant) : null,
    price: t.price,
    originalPrice: t.originalPrice,
    inStock: typeof g.item_in_stock === 'boolean' ? g.item_in_stock : null,
    imageUrl: t.img,
  }
}

function handleTiles(tiles, groupPath) {
  let gained = 0
  for (const t of tiles) {
    const id = decode(t.g.item_id)
    if (covered.has(id)) continue
    const rec = tileToRecord(t, groupPath)
    if (rec.category && EXCLUDE_CAT.test(rec.category)) {
      stats.excluded++
      covered.add(id)
      continue
    }
    covered.add(id)
    gained++
    if (t.range || !rec.size) {
      // multi-size / multi-price product, or size not shown on the tile: read its product page later
      // (per-size prices, size, EAN). The tile record is the fallback if the time budget runs out.
      pdpQueue.set(id, { url: rec.url, tile: rec, prio: t.range ? 1 : 2 })
      continue
    }
    if (writer.write(rec)) categoriesCovered.add(rec.category?.split(' > ')[0])
    if (done()) return gained
  }
  return gained
}

const SORTS = ['', 'Price%20%28Low%20to%20high%29-ascending', 'Price%20%28high%20to%20low%29-descending']
const fetchedViews = new Set()

async function fetchListing(gi, sortIdx) {
  const path = gi.kind === 'brand' ? `/en/brands/${gi.gid}` : `/en/${gi.gid}`
  const url = BASE + path + (SORTS[sortIdx] ? `?srule=${SORTS[sortIdx]}` : '')
  fetchedViews.add(gi.gid + '#' + sortIdx)
  const r = await politeFetch(url, { delayMs: HTML_DELAY })
  stats.listingPages++
  if (!r.ok) {
    stats.listingFailed++
    return 0
  }
  // make sure the page really is this category (cgid appears in its own sort/grid links)
  if (!r.data.includes(`cgid=${gi.gid}&`) && !r.data.includes(`"query":"${gi.gid}"`)) {
    stats.listingFailed++
    return 0
  }
  return handleTiles(parseTiles(r.data), gi.path)
}

async function coverWithListings() {
  // membership of the not-yet-covered universe per group
  const members = new Map()
  for (const u of universe.values()) for (const g of u.groups) if (groupInfo.has(g)) (members.get(g) ?? members.set(g, []).get(g)).push(u.id)
  const unc = (gid) => (members.get(gid) || []).filter((id) => !covered.has(id)).length
  // always start with the 7 top-level pages (default sort) so every root is represented
  for (const root of ROOTS) {
    if (done() || timeUp()) return
    await fetchListing(groupInfo.get(root), 0)
  }
  while (!done() && !timeUp() && stats.listingPages < MAX_LISTING_PAGES) {
    let best = null
    let bestGain = 0
    for (const [gid, ids] of members) {
      const left = ids.filter((id) => !covered.has(id)).length
      if (!left) continue
      const nextSort = [0, 1, 2].find((s) => !fetchedViews.has(gid + '#' + s))
      if (nextSort === undefined) continue
      if (nextSort > 0 && groupInfo.get(gid).count <= 48) continue // first page already showed everything
      const est = Math.min(left, 48)
      if (est > bestGain) {
        bestGain = est
        best = { gid, sort: nextSort }
      }
    }
    if (!best || bestGain < 2) break
    const gained = await fetchListing(groupInfo.get(best.gid), best.sort)
    if (stats.listingPages % 20 === 0) console.log(`listing pages ${stats.listingPages}, covered ${covered.size}/${universe.size}, records ${writer.count}, pdp queue ${pdpQueue.size}`)
    void gained
    void unc
  }
}

/* ---------------- 3. product pages ---------------- */
function parsePdp(html, url, masterId) {
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => {
      try {
        return JSON.parse(m[1])
      } catch {
        return null
      }
    })
    .find((x) => x && x['@type'] === 'Product')
  const vi = html.match(/"event":"view_item","ecommerce":(\{[\s\S]*?\})\}\);/)
  let g = null
  try {
    g = JSON.parse(vi[1]).items[0]
  } catch {
    /* ignore */
  }
  if (!ld && !g) return []
  const ean = html.match(/data-ean="(\d{8,14})"/)?.[1] || (g?.item_variant && /^\d{8,14}$/.test(g.item_variant) ? g.item_variant : null)
  const name = decode(ld?.name || g?.item_name)
  const brand = decode(ld?.brand?.name || ld?.brand || g?.item_brand) || null
  const category = g ? catPath(g) : null
  const inStock = ld?.offers?.availability ? /InStock/i.test(ld.offers.availability) : typeof g?.item_in_stock === 'boolean' ? g.item_in_stock : null
  const id = g?.item_id ? decode(g.item_id) : masterId
  const img = Array.isArray(ld?.image) ? ld.image[0] : ld?.image || null
  const base = { storeName: STORE_NAME, url, name, nameEn: name?.replace(/\s+/g, ' '), nameAr: null, brand, category, imageUrl: img }

  // size selector buttons (each shows its own price)
  const sizeBlock = html.match(/data-attr="size">([\s\S]*?)<div class="product-quantity/)?.[1] || ''
  const buttons = [...sizeBlock.matchAll(/<button[^>]*class="([^"]*)"[^>]*title="([^"]*)"[^>]*data-attr-value="([^"]*)"[^>]*>([\s\S]*?)<\/button>/g)]
  const selectedSize = cleanSize(g?.item_size)
  if (buttons.length > 1) {
    const recs = []
    for (const b of buttons) {
      const size = cleanSize(decode(b[2]) || b[3].replace(/_/g, " "))
      const nums = pricesIn(b[4].match(/select-attribute-price[\s\S]*$/)?.[0] || '')
      if (!nums.length) continue
      const isSel = /\bselected\b/.test(b[1])
      const unavailable = /unselectable|out-of-stock|disabled/.test(b[1])
      recs.push({
        ...base,
        storeProductId: `${id}::${decode(b[3]) || size}`,
        variant: null,
        size,
        barcode: isSel ? ean : null,
        sku: isSel && ld?.sku ? ld.sku : null,
        price: Math.min(...nums),
        originalPrice: nums.length > 1 ? Math.max(...nums) : null,
        inStock: isSel ? inStock : unavailable ? false : null,
      })
    }
    if (recs.length) return recs
  }
  // single variant: JSON-LD price is the displayed (sale) price, GTM price is the list price
  const price = ld?.offers?.price ?? (g ? g.price - (g.discount || 0) : null)
  const list = g && g.discount > 0 ? g.price : null
  return [
    {
      ...base,
      storeProductId: id,
      variant: decode(ld?.color?.name) || null,
      size: selectedSize || parseSize(name)?.text || null,
      barcode: ean,
      sku: ld?.sku || null,
      price,
      originalPrice: list,
      inStock,
    },
  ]
}

async function runPdps() {
  // products seen in no listing page
  for (const u of universe.values()) if (!covered.has(u.id) && u.url && !pdpQueue.has(u.id)) pdpQueue.set(u.id, { url: u.url, tile: null, root: u.root, prio: 0 })
  const order = [...pdpQueue.entries()].sort((a, b) => a[1].prio - b[1].prio) // not-in-listing first, then multi-size, then size-unknown
  console.log(`product pages to fetch: ${order.length} (not in listings ${order.filter((x) => x[1].prio === 0).length}, multi-price ${order.filter((x) => x[1].prio === 1).length}, size unknown ${order.filter((x) => x[1].prio === 2).length})`)
  let i = 0
  for (const [id, q] of order) {
    if (done()) break
    if (timeUp()) {
      notes.push(`time budget reached after ${stats.pdpPages} product pages; remaining multi-size / size-unknown products written from their listing tile (multi-size ones with the "from" price and size null)`)
      break
    }
    const r = await politeFetch(q.url, { delayMs: HTML_DELAY })
    stats.pdpPages++
    pdpQueue.delete(id)
    let recs = r.ok ? parsePdp(r.data, q.url, id) : []
    if (!recs.length) stats.pdpFailed++
    recs = recs.filter((x) => {
      if (x.category && EXCLUDE_CAT.test(x.category)) {
        stats.excluded++
        return false
      }
      return true
    })
    if (!recs.length && q.tile) recs = [q.tile]
    for (const rec of recs) {
      if (!rec.category && q.root) rec.category = groupInfo.get(q.root)?.path || null
      if (writer.write(rec)) categoriesCovered.add(rec.category?.split(' > ')[0])
    }
    covered.add(id)
    if (++i % 100 === 0) console.log(`product pages ${i}/${order.length}, records ${writer.count}`)
  }
  // range products whose page was not fetched: fall back to the listing tile ("from" price, size unknown)
  for (const [, q] of pdpQueue) {
    if (done() || !q.tile) continue
    stats.rangeFallback++
    if (writer.write(q.tile)) categoriesCovered.add(q.tile.category?.split(' > ')[0])
  }
}

/* ---------------- main ---------------- */
if (args.includes('--test-pdp')) {
  // debug: parse one product page and print, without writing
  const u = args[args.indexOf('--test-pdp') + 1]
  const r = await politeFetch(u, { delayMs: HTML_DELAY })
  console.log(r.status, JSON.stringify(parsePdp(r.data, u, 'test'), null, 1))
  process.exit(0)
}
await discover()
await coverWithListings()
if (!done()) await runPdps()

const lines = (await import('node:fs')).readFileSync(writer.file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
const pct = (f) => lines.filter(f).length
writeReport(STORE_ID, {
  storeName: STORE_NAME,
  baseUrl: `${BASE}/en/`,
  method:
    "public storefront search API (Constructor.io, storefront's public key) for catalog discovery + public category/brand listing pages (first page + price-sorted views) for prices + product pages for multi-size products and products absent from listings",
  categoriesCovered: [...new Set(lines.map((l) => l.category?.split(' > ')[0]).filter(Boolean))],
  recordsWritten: lines.length,
  recordsRejected: writer.rejected,
  withBarcode: pct((l) => l.barcode),
  withBrand: pct((l) => l.brand),
  withSize: pct((l) => l.size),
  withOriginalPrice: pct((l) => l.originalPrice),
  universeProducts: universe.size,
  listingPages: stats.listingPages,
  listingFailed: stats.listingFailed,
  productPages: stats.pdpPages,
  productPagesFailed: stats.pdpFailed,
  excludedNonBeauty: stats.excluded,
  rangeFallback: stats.rangeFallback,
  blocked: false,
  notes: [
    'Roots collected: ' + ROOTS.map((r) => ROOT_LABEL[r]).join(', '),
    'Multi-size products produce one record per size (storeProductId "<masterId>::<size>"); barcode only for the size selected by default on the page (the only EAN the page exposes).',
    'Listing tiles do not expose EAN; barcodes come only from product pages.',
    'robots.txt disallows Search-UpdateGrid and &sz= pagination, so catalog coverage relies on many category/brand first pages + price-sorted views.',
    'Names are English (/en/ storefront); Arabic names not collected (would double request volume).',
    ...notes,
  ],
})
console.log(`done: ${lines.length} records in raw/${STORE_ID}.jsonl`, stats)
