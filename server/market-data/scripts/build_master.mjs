/**
 * Build the LOOKS master catalog workbook from collected market listings and
 * supplier price lists.
 *
 *   node scripts/build_master.mjs
 *
 * Inputs : raw/<store>.jsonl (+ .report.json), suppliers/<supplier>.json
 * Output : output/LOOKS-Master-Catalog-<date>.xlsx  and  output/master-catalog.json (for the website import)
 *
 * Principles: nothing is estimated. Every empty value is written as an explicit
 * reason ("Not found", "Not provided by supplier", …) so no cell is blank.
 * Market prices are VAT-inclusive (as shown to shoppers); supplier costs are
 * VAT-exclusive; margins compare like with like (market price ÷ 1.15 vs cost).
 */
import fs from 'node:fs'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { mapCategory } from '../lib/category.mjs'
import { brandDisplay, brandKey, canonicalBrands, clusterListings, matchSuppliersToMarket, sizeKey } from '../lib/match.mjs'
import { hasArabic, parseSize, RAW_DIR, ROOT, splitArEn } from '../lib/record.mjs'

const VAT = 0.15
const TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' })

/* ---------------- Stores ---------------- */

export const STORES = [
  { id: 'looieen', name: 'Looieen', url: 'https://looieen.com/' },
  { id: 'goldenscent', name: 'Golden Scent', url: 'https://www.goldenscent.com/', excluded: 'Not included — the site’s robots.txt opts out of AI-assisted collection (ClaudeBot / anthropic-ai), so its data was deleted. Prices can be checked manually if needed.' },
  { id: 'niceone', name: 'Nice One', url: 'https://niceonesa.com/' },
  { id: 'faces', name: 'Faces', url: 'https://www.faces.sa/' },
  { id: 'sephora', name: 'Sephora KSA', url: 'https://www.sephora.me/sa-en' },
  { id: 'nahdi', name: 'Nahdi Online', url: 'https://www.nahdionline.com/' },
  { id: 'whites', name: 'Whites', url: 'https://www.whites.sa/' },
  { id: 'aldawaa', name: 'Al-Dawaa', url: 'https://www.al-dawaa.com/' },
  { id: 'watsons', name: 'Watsons', url: 'https://www.watsons.sa/' },
  { id: 'beautyselect', name: 'Beauty Select', url: 'https://beautyselect.sa/' },
  { id: 'cosmeticssa', name: 'Cosmetics.sa', url: 'https://cosmetics.sa/' },
  { id: 'kohlalward', name: 'Kohl Al Ward', url: 'https://kohlalward.com/' },
  { id: 'amazon', name: 'Amazon.sa', url: 'https://www.amazon.sa/', excluded: 'Not collected — the site’s terms of use prohibit automated data collection' },
  { id: 'noon', name: 'Noon', url: 'https://www.noon.com/saudi-en/', excluded: 'Not collected — the site’s terms of use prohibit automated data collection' },
]

/* ---------------- Load inputs ---------------- */

function readJsonl(file) {
  if (!fs.existsSync(file)) return []
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => {
      try {
        return JSON.parse(l)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

const reports = {}
const listings = []
for (const s of STORES) {
  const rep = path.join(RAW_DIR, `${s.id}.report.json`)
  reports[s.id] = fs.existsSync(rep) ? JSON.parse(fs.readFileSync(rep, 'utf8')) : null
  for (const r of readJsonl(path.join(RAW_DIR, `${s.id}.jsonl`))) {
    if (!r.price || !r.url || !r.name) continue
    listings.push({ ...r, storeId: s.id, storeName: s.name })
  }
}

const suppliers = []
for (const f of fs.existsSync(path.join(ROOT, 'suppliers')) ? fs.readdirSync(path.join(ROOT, 'suppliers')) : []) {
  if (!f.endsWith('.json')) continue
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'suppliers', f), 'utf8'))
  for (const it of d.items) suppliers.push({ ...it, _file: f })
}
const supplierIssues = suppliers.length ? fs.readdirSync(path.join(ROOT, 'suppliers')).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'suppliers', f), 'utf8')).issues.map((i) => ({ ...i, supplier: f.replace('.json', '') }))) : []

console.log(`listings: ${listings.length} from ${new Set(listings.map((l) => l.storeId)).size} stores · supplier items: ${suppliers.length}`)

/* ---------------- Cluster market listings + supplier items ---------------- */

const items = [
  ...suppliers.map((s, i) => ({
    key: `sup:${i}`,
    kind: 'supplier',
    storeId: `supplier:${s.supplier}`,
    brand: s.brand,
    name: s.nameEn ?? s.nameAr,
    nameEn: s.nameEn,
    // supplier lists sometimes give a bare number ("300") — Keune/Wella liquids are in ml
    size: /^\d+(\.\d+)?$/.test(String(s.size ?? '').trim()) ? `${String(s.size).trim()}ml` : s.size,
    barcode: s.barcode,
    ref: s,
  })),
  ...listings.map((l, i) => {
    const split = l.nameEn || l.nameAr ? { en: l.nameEn, ar: l.nameAr } : splitArEn(l.name)
    return { key: `lst:${i}`, kind: 'listing', storeId: l.storeId, brand: l.brand, name: l.name, nameEn: split.en ?? (hasArabic(l.name) ? null : l.name), size: l.size, barcode: l.barcode, ref: l }
  }),
]
// One canonical key per brand ("KEUNE CARE" = "Keune", "La Rouche Posay" = "La Roche-Posay")
const brandCanon = canonicalBrands(items)
for (const it of items) it.brandCanon = brandCanon.get(brandKey(it.brand)) ?? brandKey(it.brand)
const clusters = clusterListings(items)
// Second pass: supplier items without a barcode match → same brand + size + type + product-line words
const supplierMatch = matchSuppliersToMarket(clusters)
console.log(`clusters (products): ${clusters.length} · supplier items matched by name: ${supplierMatch.attached.length} · possible matches for review: ${supplierMatch.review.length}`)

/* ---------------- Build product rows ---------------- */

const round2 = (n) => Math.round(n * 100) / 100
const mostCommon = (arr) => {
  const m = new Map()
  arr.filter(Boolean).forEach((x) => m.set(x, (m.get(x) ?? 0) + 1))
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

/** How sure we are that the prices in a row belong to the same exact product */
function CONFIDENCE(method, nStores, nSup) {
  if (method === 'Barcode') return 'High — same barcode (EAN)'
  if (method === 'Name + size') return 'Medium — same brand, size & name (spot-check)'
  if (method === 'Supplier name + size') return 'Medium — supplier name matched to store listing (spot-check)'
  return nStores + nSup > 1 ? 'Medium' : 'Single source — nothing to match'
}

const products = []
let seq = 0
for (const c of clusters) {
  const sup = c.members.filter((m) => m.kind === 'supplier').map((m) => m.ref)
  const lst = c.members.filter((m) => m.kind === 'listing').map((m) => m.ref)
  // One price per store (lowest when a store lists the same barcode twice)
  const perStore = new Map()
  for (const l of lst) {
    const cur = perStore.get(l.storeId)
    if (!cur || l.price < cur.price) perStore.set(l.storeId, l)
  }
  const prices = [...perStore.values()].map((l) => l.price)
  const min = prices.length ? Math.min(...prices) : null
  const max = prices.length ? Math.max(...prices) : null
  const avg = prices.length ? round2(prices.reduce((a, b) => a + b, 0) / prices.length) : null
  const sorted = [...prices].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median = !sorted.length ? null : sorted.length % 2 ? sorted[mid] : round2((sorted[mid - 1] + sorted[mid]) / 2)

  // Several suppliers can offer the same product — the lowest net cost is used for margins
  const s0 = [...sup].sort((a, b) => (a.netCost ?? Infinity) - (b.netCost ?? Infinity))[0]
  const brandRaw = s0?.brand ?? mostCommon(lst.map((l) => l.brand))
  const brand = brandDisplay(brandRaw) ?? 'Not specified by source'
  const nameEn = s0?.nameEn ?? lst.map((l) => l.nameEn ?? (hasArabic(l.name) ? splitArEn(l.name).en : l.name)).find((n) => n && n.length > 3) ?? null
  const nameAr = s0?.nameAr ?? lst.map((l) => l.nameAr ?? (hasArabic(l.name) ? splitArEn(l.name).ar : null)).find(Boolean) ?? null
  const sz = parseSize(s0?.size) ?? lst.map((l) => parseSize(l.size) ?? parseSize(l.nameEn) ?? parseSize(l.name)).find(Boolean) ?? null
  const variant = lst.map((l) => l.variant).find(Boolean) ?? null
  const barcode = [...c.barcodes][0] ?? s0?.barcode ?? null
  const storeCats = lst.map((l) => l.category).filter(Boolean).join(' | ')
  const cat = mapCategory(nameEn ?? nameAr ?? lst[0]?.name, storeCats, { brand: brandRaw, productLine: s0?.productLine, supplierCategory: s0?.category ?? (s0 ? 'hair' : '') })
  const lastVerified = lst.map((l) => l.collectedAt).sort().pop() ?? null
  const imageRef = lst.find((l) => l.imageUrl)

  const flags = []
  if (!cat.confident) flags.push('Category needs review')
  if (min && max && max / min > 2.5) flags.push(`Price spread ${round2(max / min)}x across stores — verify match`)
  if (sup.some((s) => s.discontinued)) flags.push('Marked discontinued (DISC) in supplier list')
  if (sup.some((s) => s.nonSaleable)) flags.push('Supplier marketing material (POSM / colour chart) — not for sale')
  if (sup.length > 1) flags.push(`Appears ${sup.length}× in supplier lists — check duplicate codes`)
  if (lst.length && !lst.some((l) => l.inStock !== false)) flags.push('Out of stock at all stores found')

  const status = prices.length >= 2 ? `Verified — ${prices.length} stores` : prices.length === 1 ? 'Verified — single store' : sup.length ? 'Supplier only — not found at collected stores' : 'Not verified'

  products.push({
    id: `LK-${String(++seq).padStart(6, '0')}`,
    brand,
    brandKey: brandCanon.get(brandKey(brandRaw)) ?? brandKey(brandRaw),
    nameEn,
    nameAr,
    category: cat,
    productLine: s0?.productLine ?? null,
    size: sz ? `${sz.value} ${sz.unit}` : (s0?.size ?? lst.map((l) => l.size).find(Boolean) ?? null),
    sizeKey: sizeKey(sz),
    variant,
    barcode,
    supplierCode: s0?.supplierCode ?? lst.map((l) => l.sku).find(Boolean) ?? null,
    perStore,
    storesFound: prices.length,
    min,
    max,
    avg,
    median,
    avgEx: avg ? round2(avg / (1 + VAT)) : null,
    lowestStore: min ? [...perStore.values()].find((l) => l.price === min)?.storeName : null,
    supplier: s0 ?? null,
    method: c.method,
    confidence: CONFIDENCE(c.method, prices.length, sup.length),
    cluster: c,
    status,
    imageRef: imageRef?.imageUrl ?? null,
    imageStore: imageRef?.storeName ?? null,
    lastVerified,
    flags,
    listings: lst,
    supplierRows: sup,
  })
}

// Sort: brand, then name — easier to review
products.sort((a, b) => a.brand.localeCompare(b.brand) || (a.nameEn ?? a.nameAr ?? '').localeCompare(b.nameEn ?? b.nameAr ?? ''))
products.forEach((p, i) => (p.id = `LK-${String(i + 1).padStart(6, '0')}`))

// Uncertain supplier ↔ store matches are not combined; the supplier row is flagged instead
{
  const byCluster = new Map(products.map((p) => [p.cluster, p]))
  for (const rv of supplierMatch.review) {
    const sp = byCluster.get(rv.supplierCluster)
    const mp = byCluster.get(rv.cluster)
    if (sp && mp && mp.listings.length && !sp.flags.some((f) => f.includes(mp.id))) sp.flags.push(`Possible store match ${mp.id} — see "Match Review"`)
  }
}

/* ---------------- Workbook ---------------- */

const wb = new ExcelJS.Workbook()
wb.creator = 'LOOKS'
wb.created = new Date()
// Margin formulas are stored without cached results — force Excel to calculate on open
wb.calcProperties = { fullCalcOnLoad: true }

const NA = {
  notFound: 'Not found',
  notListed: 'Not listed at this store',
  noSupplier: 'Not provided by supplier yet',
  noBarcode: 'Not published by source',
  noArabic: 'Not available in Arabic at source',
  noEnglish: 'Not available in English at source',
  noSize: 'Not specified by source',
  noVariant: 'Single variant',
  noImage: 'No image reference found',
  pendingPrice: 'To be set by LOOKS',
}

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A1E22' } }
const HEADER_FONT = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 }
const MONEY = '#,##0.00'
const PCT = '0.0%'

function sheet(name, columns, opts = {}) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', xSplit: opts.freezeCols ?? 0, ySplit: 1, rightToLeft: false }] })
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 16, style: c.style }))
  const head = ws.getRow(1)
  head.eachCell((cell) => {
    cell.fill = c0(columns, cell.col - 1)?.group === 'looks' ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB76E79' } } : c0(columns, cell.col - 1)?.group === 'supplier' ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7A5A26' } } : c0(columns, cell.col - 1)?.group === 'market' ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3D2F33' } } : HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = { vertical: 'middle', wrapText: true }
  })
  head.height = 34
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }
  return ws
}
const c0 = (cols, i) => cols[i]

/* ---- Master Catalog ---- */

const activeStores = STORES.filter((s) => !s.excluded)
const masterCols = [
  { header: 'LOOKS ID', key: 'id', width: 12 },
  { header: 'Catalog status', key: 'catalogStatus', width: 22 },
  { header: 'Brand', key: 'brand', width: 22 },
  { header: 'Product name (English)', key: 'nameEn', width: 46 },
  { header: 'Product name (Arabic)', key: 'nameAr', width: 40 },
  { header: 'LOOKS main category', key: 'mainEn', width: 16 },
  { header: 'LOOKS subcategory', key: 'subEn', width: 18 },
  { header: 'Category (Arabic)', key: 'catAr', width: 26 },
  { header: 'Category check', key: 'catConf', width: 14 },
  { header: 'Product line', key: 'line', width: 20 },
  { header: 'Size / volume', key: 'size', width: 13 },
  { header: 'Variant / shade', key: 'variant', width: 18 },
  { header: 'Barcode (EAN)', key: 'barcode', width: 16 },
  { header: 'Supplier code / SKU', key: 'code', width: 16 },
  ...activeStores.flatMap((s) => [
    { header: `${s.name} price (SAR incl. VAT)`, key: `p_${s.id}`, width: 13, style: { numFmt: MONEY }, group: 'market' },
    ...(s.id === 'looieen' ? [{ header: 'Looieen original price before discount (SAR)', key: 'p_looieen_orig', width: 15, style: { numFmt: MONEY }, group: 'market' }] : []),
    { header: `${s.name} link`, key: `u_${s.id}`, width: 14, group: 'market' },
  ]),
  { header: 'Amazon.sa — check price (search link)', key: 'q_amazon', width: 16, group: 'market' },
  { header: 'Noon — check price (search link)', key: 'q_noon', width: 16, group: 'market' },
  { header: 'Golden Scent / Sephora / Al-Dawaa / brand store — check price (search link)', key: 'q_other', width: 18, group: 'market' },
  { header: 'Stores found', key: 'storesFound', width: 9, group: 'market' },
  { header: 'Lowest market price (SAR incl. VAT)', key: 'min', width: 13, style: { numFmt: MONEY }, group: 'market' },
  { header: 'Lowest price at', key: 'lowestStore', width: 15, group: 'market' },
  { header: 'Highest market price (SAR incl. VAT)', key: 'max', width: 13, style: { numFmt: MONEY }, group: 'market' },
  { header: 'Average market price (SAR incl. VAT)', key: 'avg', width: 13, style: { numFmt: MONEY }, group: 'market' },
  { header: 'Average market price (SAR excl. VAT)', key: 'avgEx', width: 13, style: { numFmt: MONEY }, group: 'market' },
  { header: 'Median market price (SAR incl. VAT)', key: 'median', width: 13, style: { numFmt: MONEY }, group: 'market' },
  { header: 'Supplier (lowest cost)', key: 'supplier', width: 18, group: 'supplier' },
  { header: 'All supplier offers (net cost SAR excl. VAT)', key: 'supOffers', width: 28, group: 'supplier' },
  { header: 'Supplier list price (SAR excl. VAT)', key: 'supList', width: 13, style: { numFmt: MONEY }, group: 'supplier' },
  { header: 'Supplier discount', key: 'supDisc', width: 10, style: { numFmt: '0%' }, group: 'supplier' },
  { header: 'Supplier net purchase cost (SAR excl. VAT)', key: 'cost', width: 14, style: { numFmt: MONEY }, group: 'supplier' },
  { header: 'Gross profit at avg market price (SAR excl. VAT)', key: 'gp', width: 14, style: { numFmt: MONEY }, group: 'supplier' },
  { header: 'Gross margin at avg market price', key: 'gm', width: 11, style: { numFmt: PCT }, group: 'supplier' },
  { header: 'Markup at avg market price', key: 'mu', width: 11, style: { numFmt: PCT }, group: 'supplier' },
  { header: 'LOOKS selling price (SAR incl. VAT)', key: 'looksPrice', width: 14, style: { numFmt: MONEY }, group: 'looks' },
  { header: 'LOOKS gross profit (SAR excl. VAT)', key: 'looksGp', width: 14, style: { numFmt: MONEY }, group: 'looks' },
  { header: 'LOOKS gross margin', key: 'looksGm', width: 11, style: { numFmt: PCT }, group: 'looks' },
  { header: 'LOOKS vs average market price', key: 'looksVsMkt', width: 12, style: { numFmt: PCT }, group: 'looks' },
  { header: 'Data status', key: 'status', width: 26 },
  { header: 'Match method', key: 'method', width: 14 },
  { header: 'Match confidence', key: 'confidence', width: 30 },
  { header: 'Image reference (source)', key: 'image', width: 22 },
  { header: 'Image publication rights', key: 'imageRights', width: 30 },
  { header: 'Description & specifications', key: 'desc', width: 34 },
  { header: 'Price last verified (date)', key: 'verified', width: 13 },
  { header: 'Flags / notes', key: 'flags', width: 40 },
]
/**
 * Search links for stores whose terms or protection do not allow automated collection
 * (Amazon.sa, Noon, Golden Scent, Sephora, Al-Dawaa, brand stores). Opening them is a
 * normal manual check — no data is collected from these sites.
 */
function searchQuery(p) {
  if (p.barcode && /^\d{8,14}$/.test(p.barcode)) return p.barcode
  let name = p.nameEn ?? p.nameAr ?? ''
  if (name.toLowerCase().startsWith(p.brand.toLowerCase())) name = name.slice(p.brand.length)
  return `${p.brand} ${name} ${p.size ?? ''}`.replace(/\s+/g, ' ').trim()
}
const link = (url) => ({ text: url, hyperlink: url })
function searchUrl(where, p) {
  const q = searchQuery(p)
  const nameQ = `${p.brand} ${(p.nameEn ?? p.nameAr ?? '')} ${p.size ?? ''}`.replace(/\s+/g, ' ').trim()
  if (where === 'amazon') return `https://www.amazon.sa/s?k=${encodeURIComponent(q)}`
  if (where === 'noon') return `https://www.noon.com/saudi-en/search/?q=${encodeURIComponent(nameQ)}`
  return `https://www.google.com/search?q=${encodeURIComponent(`${nameQ} (site:goldenscent.com OR site:sephora.me OR site:al-dawaa.com OR site:keunesaudi.com)`)}`
}
const ws = sheet('Master Catalog', masterCols, { freezeCols: 4 })
const colIndex = Object.fromEntries(masterCols.map((c, i) => [c.key, i + 1]))
const colLetter = (k) => ws.getColumn(colIndex[k]).letter

products.forEach((p, i) => {
  const r = i + 2
  const row = {
    id: p.id,
    catalogStatus: 'Inactive — pending LOOKS approval',
    brand: p.brand,
    nameEn: p.nameEn ?? NA.noEnglish,
    nameAr: p.nameAr ?? NA.noArabic,
    mainEn: p.category.mainEn,
    subEn: p.category.subEn,
    catAr: `${p.category.mainAr} › ${p.category.subAr}`,
    catConf: p.category.confident ? 'Auto-mapped' : 'Needs review',
    line: p.productLine ?? 'Not specified by source',
    size: p.size ?? NA.noSize,
    variant: p.variant ?? NA.noVariant,
    barcode: p.barcode ? String(p.barcode) : NA.noBarcode,
    code: p.supplierCode ? String(p.supplierCode) : NA.noBarcode,
    storesFound: p.storesFound,
    min: p.min ?? NA.notFound,
    lowestStore: p.lowestStore ?? NA.notFound,
    max: p.max ?? NA.notFound,
    avg: p.avg ?? NA.notFound,
    avgEx: p.avgEx ?? NA.notFound,
    median: p.median ?? NA.notFound,
    supplier: p.supplier?.supplier ?? NA.noSupplier,
    supOffers: p.supplierRows.length ? p.supplierRows.map((x) => `${x.supplier} ${x.supplierCode ?? ''}: ${x.netCost ?? 'n/a'}`.replace(/\s+:/, ':')).join('; ') : NA.noSupplier,
    q_amazon: link(searchUrl('amazon', p)),
    q_noon: link(searchUrl('noon', p)),
    q_other: link(searchUrl('other', p)),
    confidence: p.confidence,
    supList: p.supplier?.listPrice ?? NA.noSupplier,
    supDisc: p.supplier?.discount ?? NA.noSupplier,
    cost: p.supplier?.netCost ?? NA.noSupplier,
    looksPrice: NA.pendingPrice,
    status: p.status,
    method: p.method,
    image: p.imageRef ? { text: `View (${p.imageStore})`, hyperlink: p.imageRef } : NA.noImage,
    imageRights: p.imageRef ? `Pending authorization — image belongs to brand/${p.imageStore}; request official image from distributor` : 'Official image required from distributor',
    desc: 'Pending — official distributor content or original LOOKS copy required before publishing',
    verified: p.lastVerified ? p.lastVerified.slice(0, 10) : 'Not verified online',
    flags: p.flags.length ? p.flags.join('; ') : 'None',
  }
  for (const s of activeStores) {
    const l = p.perStore.get(s.id)
    const blocked = reports[s.id]?.blocked
    row[`p_${s.id}`] = l ? l.price : blocked ? 'Store not accessible' : NA.notListed
    row[`u_${s.id}`] = l ? { text: l.url, hyperlink: l.url } : blocked ? 'Store not accessible' : NA.notListed
    if (s.id === 'looieen') row.p_looieen_orig = l ? (l.originalPrice ?? 'No discount') : blocked ? 'Store not accessible' : NA.notListed
  }
  ws.addRow(row)
  // Formulas: margins at avg market price (computed only when both numbers exist)
  const A = (k) => `${colLetter(k)}${r}`
  ws.getCell(A('gp')).value = { formula: `IFERROR(${A('avgEx')}-${A('cost')},"Needs supplier cost & market price")` }
  ws.getCell(A('gm')).value = { formula: `IFERROR((${A('avgEx')}-${A('cost')})/${A('avgEx')},"Needs supplier cost & market price")` }
  ws.getCell(A('mu')).value = { formula: `IFERROR((${A('avgEx')}-${A('cost')})/${A('cost')},"Needs supplier cost & market price")` }
  // LOOKS price is entered by the client; these recalculate automatically
  ws.getCell(A('looksGp')).value = { formula: `IFERROR(${A('looksPrice')}/(1+${VAT})-${A('cost')},"Enter LOOKS price & supplier cost")` }
  ws.getCell(A('looksGm')).value = { formula: `IFERROR((${A('looksPrice')}/(1+${VAT})-${A('cost')})/(${A('looksPrice')}/(1+${VAT})),"Enter LOOKS price & supplier cost")` }
  ws.getCell(A('looksVsMkt')).value = { formula: `IFERROR(${A('looksPrice')}/${A('avg')}-1,"Enter LOOKS price")` }
})

// Highlight editable LOOKS price column and low/negative margins
ws.getColumn(colIndex.looksPrice).eachCell((cell, rn) => {
  if (rn > 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6E9EA' } }
})
if (products.length) {
  const last = products.length + 1
  ws.addConditionalFormatting({
    ref: `${colLetter('gm')}2:${colLetter('gm')}${last}`,
    rules: [
      { type: 'cellIs', operator: 'lessThan', formulae: ['0'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF4C7C7' } }, font: { color: { argb: 'FF8F2E2E' } } }, priority: 1 },
      { type: 'cellIs', operator: 'between', formulae: ['0', '0.2'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF6EEDF' } } }, priority: 2 },
    ],
  })
}

/* ---- Market Listings (one row per store listing) ---- */

const ml = sheet('Market Listings', [
  { header: 'LOOKS ID', key: 'id', width: 12 },
  { header: 'Store', key: 'store', width: 15 },
  { header: 'Name as listed', key: 'name', width: 50 },
  { header: 'Brand as listed', key: 'brand', width: 22 },
  { header: 'Store category', key: 'cat', width: 30 },
  { header: 'Size as listed', key: 'size', width: 12 },
  { header: 'Variant / shade', key: 'variant', width: 16 },
  { header: 'Barcode', key: 'barcode', width: 16 },
  { header: 'Store SKU', key: 'sku', width: 16 },
  { header: 'Price (SAR incl. VAT)', key: 'price', width: 12, style: { numFmt: MONEY } },
  { header: 'Original price before discount (SAR)', key: 'orig', width: 13, style: { numFmt: MONEY } },
  { header: 'Discount', key: 'disc', width: 9, style: { numFmt: '0%' } },
  { header: 'In stock', key: 'stock', width: 10 },
  { header: 'Product link', key: 'url', width: 14 },
  { header: 'Collected at', key: 'at', width: 18 },
])
for (const p of products)
  for (const l of p.listings)
    ml.addRow({
      id: p.id,
      store: l.storeName,
      name: l.name,
      brand: l.brand ?? 'Not specified by store',
      cat: l.category ?? 'Not specified by store',
      size: l.size ?? 'Not specified by store',
      variant: l.variant ?? 'Single variant',
      barcode: l.barcode ?? 'Not published by store',
      sku: l.sku ?? 'Not published by store',
      price: l.price,
      orig: l.originalPrice ?? 'No discount',
      disc: l.originalPrice ? round2(1 - l.price / l.originalPrice) : 0,
      stock: l.inStock === true ? 'Yes' : l.inStock === false ? 'No' : 'Not shown by store',
      url: { text: 'Open', hyperlink: l.url },
      at: l.collectedAt.replace('T', ' ').slice(0, 16),
    })

/* ---- Supplier Costs ---- */

const sc = sheet('Supplier Costs', [
  { header: 'LOOKS ID', key: 'id', width: 12 },
  { header: 'Supplier', key: 'supplier', width: 18 },
  { header: 'Supplier code', key: 'code', width: 14 },
  { header: 'Barcode', key: 'barcode', width: 16 },
  { header: 'Product name (English)', key: 'en', width: 46 },
  { header: 'Product name (Arabic)', key: 'ar', width: 34 },
  { header: 'Category (supplier)', key: 'cat', width: 14 },
  { header: 'Product line', key: 'line', width: 22 },
  { header: 'Size', key: 'size', width: 11 },
  { header: 'List price (SAR excl. VAT)', key: 'list', width: 12, style: { numFmt: MONEY } },
  { header: 'Discount', key: 'disc', width: 9, style: { numFmt: '0%' } },
  { header: 'Net purchase cost (SAR excl. VAT)', key: 'net', width: 13, style: { numFmt: MONEY } },
  { header: 'Price basis', key: 'basis', width: 40 },
  { header: 'Found online', key: 'found', width: 22 },
  { header: 'Average market price (SAR incl. VAT)', key: 'avg', width: 13, style: { numFmt: MONEY } },
  { header: 'Notes', key: 'notes', width: 34 },
  { header: 'Source page in PDF', key: 'page', width: 9 },
])
for (const p of products)
  for (const s of p.supplierRows)
    sc.addRow({
      id: p.id,
      supplier: s.supplier,
      code: s.supplierCode ?? 'Missing in supplier list',
      barcode: s.barcode ?? 'Missing in supplier list',
      en: s.nameEn ?? 'Not provided',
      ar: s.nameAr ?? 'Not provided in supplier list',
      cat: s.category ?? 'Hair care (supplier)',
      line: s.productLine ?? 'Not specified',
      size: s.size ?? 'Not specified',
      list: s.listPrice ?? 'Not provided',
      disc: s.discount ?? 0,
      net: s.netCost,
      basis: s.priceBasis,
      found: p.storesFound ? `Yes — ${p.storesFound} store(s)` : 'Not found at collected stores',
      avg: p.avg ?? 'Not found',
      notes: [s.discontinued && 'Discontinued (DISC)', s.nonSaleable && 'Marketing material — not for sale'].filter(Boolean).join('; ') || 'None',
      page: s.sourcePage,
    })

/* ---- Supplier vs Market (every supplier item with all store prices, links and margins) ---- */

const productByCluster = new Map(products.map((p) => [p.cluster, p]))
const PINK = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6E9EA' } }
const LINKOUT = (cellRef, label) => `IF(LEFT(${cellRef},4)="http",HYPERLINK(${cellRef},"${label}"),${cellRef})`

const svmCols = [
  { header: 'Rank (by gross margin)', key: 'rank', width: 9 },
  { header: 'LOOKS ID', key: 'id', width: 12 },
  { header: 'Supplier', key: 'supplier', width: 18, group: 'supplier' },
  { header: 'Supplier code', key: 'code', width: 12, group: 'supplier' },
  { header: 'Brand', key: 'brand', width: 18 },
  { header: 'Product name (supplier list)', key: 'en', width: 40 },
  { header: 'Product name (Arabic)', key: 'ar', width: 34 },
  { header: 'Size', key: 'size', width: 10 },
  { header: 'Barcode (EAN)', key: 'barcode', width: 16 },
  { header: 'Net purchase cost (SAR excl. VAT)', key: 'cost', width: 13, style: { numFmt: MONEY }, group: 'supplier' },
  ...activeStores.flatMap((st) => [
    { header: `${st.name} price (SAR incl. VAT)`, key: `p_${st.id}`, width: 12, style: { numFmt: MONEY }, group: 'market' },
    { header: `${st.name} link`, key: `u_${st.id}`, width: 14, group: 'market' },
  ]),
  { header: 'Amazon.sa — check price (search link)', key: 'q_amazon', width: 16, group: 'market' },
  { header: 'Noon — check price (search link)', key: 'q_noon', width: 16, group: 'market' },
  { header: 'Other Saudi stores — check price (search link)', key: 'q_other', width: 16, group: 'market' },
  { header: 'Stores found', key: 'n', width: 9, group: 'market' },
  { header: 'Lowest market price (SAR incl. VAT)', key: 'min', width: 12, style: { numFmt: MONEY }, group: 'market' },
  { header: 'Lowest price at', key: 'lowestStore', width: 14, group: 'market' },
  { header: 'Highest market price (SAR incl. VAT)', key: 'max', width: 12, style: { numFmt: MONEY }, group: 'market' },
  { header: 'Average market price (SAR incl. VAT)', key: 'avg', width: 12, style: { numFmt: MONEY }, group: 'market' },
  { header: 'Median market price (SAR incl. VAT)', key: 'median', width: 12, style: { numFmt: MONEY }, group: 'market' },
  { header: 'Average market price (SAR excl. VAT)', key: 'avgEx', width: 12, style: { numFmt: MONEY }, group: 'market' },
  { header: 'Gross profit per unit at average price (SAR excl. VAT)', key: 'gp', width: 13, style: { numFmt: MONEY }, group: 'looks' },
  { header: 'Gross margin at average price', key: 'gm', width: 11, style: { numFmt: PCT }, group: 'looks' },
  { header: 'Gross margin at lowest price', key: 'gmLow', width: 11, style: { numFmt: PCT }, group: 'looks' },
  { header: 'Gross margin at highest price', key: 'gmHigh', width: 11, style: { numFmt: PCT }, group: 'looks' },
  { header: 'Match method', key: 'method', width: 16 },
  { header: 'Match confidence', key: 'confidence', width: 30 },
  { header: 'Data status', key: 'status', width: 26 },
  { header: 'Flags / notes', key: 'flags', width: 40 },
]
const svm = sheet('Supplier vs Market', svmCols, { freezeCols: 6 })
const svmIdx = Object.fromEntries(svmCols.map((c, i) => [c.key, i + 1]))
const svmL = (k) => svm.getColumn(svmIdx[k]).letter
const supRowsAll = products.flatMap((p) => p.supplierRows.map((sr) => ({ p, sr })))
const marginOf = ({ p, sr }) => (p.avgEx && sr.netCost ? (p.avgEx - sr.netCost) / p.avgEx : -99)
supRowsAll.sort((a, b) => Number(b.p.storesFound > 0) - Number(a.p.storesFound > 0) || marginOf(b) - marginOf(a) || b.p.storesFound - a.p.storesFound)
supRowsAll.forEach(({ p, sr }, i) => {
  const r = i + 2
  const row = {
    rank: p.storesFound ? i + 1 : 'Not ranked — no market price',
    id: p.id,
    supplier: sr.supplier,
    code: sr.supplierCode ?? 'Missing in supplier list',
    brand: p.brand,
    en: sr.nameEn ?? 'Not provided',
    ar: sr.nameAr ?? p.nameAr ?? NA.noArabic,
    size: sr.size ? String(sr.size) : (p.size ?? NA.noSize),
    barcode: sr.barcode ?? p.barcode ?? NA.noBarcode,
    cost: sr.netCost ?? 'Not provided',
    q_amazon: link(searchUrl('amazon', p)),
    q_noon: link(searchUrl('noon', p)),
    q_other: link(searchUrl('other', p)),
    n: p.storesFound,
    min: p.min ?? NA.notFound,
    lowestStore: p.lowestStore ?? NA.notFound,
    max: p.max ?? NA.notFound,
    avg: p.avg ?? NA.notFound,
    median: p.median ?? NA.notFound,
    avgEx: p.avgEx ?? NA.notFound,
    method: p.method,
    confidence: p.confidence,
    status: p.status,
    flags: p.flags.length ? p.flags.join('; ') : 'None',
  }
  for (const st of activeStores) {
    const l = p.perStore.get(st.id)
    const blocked = reports[st.id]?.blocked
    row[`p_${st.id}`] = l ? l.price : blocked ? 'Store not accessible' : NA.notListed
    row[`u_${st.id}`] = l ? link(l.url) : blocked ? 'Store not accessible' : NA.notListed
  }
  svm.addRow(row)
  const A = (k) => `${svmL(k)}${r}`
  const need = '"Needs market price & supplier cost"'
  svm.getCell(A('gp')).value = { formula: `IFERROR(${A('avgEx')}-${A('cost')},${need})` }
  svm.getCell(A('gm')).value = { formula: `IFERROR((${A('avgEx')}-${A('cost')})/${A('avgEx')},${need})` }
  svm.getCell(A('gmLow')).value = { formula: `IFERROR((${A('min')}/(1+${VAT})-${A('cost')})/(${A('min')}/(1+${VAT})),${need})` }
  svm.getCell(A('gmHigh')).value = { formula: `IFERROR((${A('max')}/(1+${VAT})-${A('cost')})/(${A('max')}/(1+${VAT})),${need})` }
})
if (supRowsAll.length)
  svm.addConditionalFormatting({
    ref: `${svmL('gm')}2:${svmL('gmHigh')}${supRowsAll.length + 1}`,
    rules: [
      { type: 'cellIs', operator: 'lessThan', formulae: ['0'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF4C7C7' } } }, priority: 1 },
      { type: 'cellIs', operator: 'greaterThanOrEqual', formulae: ['0.35'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFDDEFD9' } } }, priority: 2 },
    ],
  })

/* ---- Match Review (possible matches that were NOT combined) ---- */

const mr = sheet('Match Review', [
  { header: 'Supplier', key: 'supplier', width: 18 },
  { header: 'Supplier code', key: 'code', width: 12 },
  { header: 'Supplier product', key: 'supName', width: 40 },
  { header: 'Supplier size', key: 'supSize', width: 10 },
  { header: 'Net cost (SAR excl. VAT)', key: 'cost', width: 12, style: { numFmt: MONEY } },
  { header: 'Supplier row LOOKS ID', key: 'supId', width: 12 },
  { header: 'Possible market product LOOKS ID', key: 'mktId', width: 12 },
  { header: 'Store listing name', key: 'mktName', width: 50 },
  { header: 'Store size', key: 'mktSize', width: 11 },
  { header: 'Store(s)', key: 'stores', width: 20 },
  { header: 'Price(s) (SAR incl. VAT)', key: 'prices', width: 16 },
  { header: 'Store link', key: 'url', width: 18 },
  { header: 'Name agreement', key: 'cover', width: 10, style: { numFmt: '0%' } },
  { header: 'Why it needs review', key: 'reason', width: 46 },
  { header: 'Decision (Same / Different)', key: 'decision', width: 16, group: 'looks' },
])
let reviewRows = 0
for (const rv of supplierMatch.review) {
  const sp = productByCluster.get(rv.supplierCluster)
  const mp = productByCluster.get(rv.cluster)
  if (!sp || !mp || !mp.listings.length) continue
  const s0 = rv.supplierCluster.members[0].ref
  const l0 = mp.listings[0]
  mr.addRow({
    supplier: s0.supplier,
    code: s0.supplierCode ?? 'Missing in supplier list',
    supName: s0.nameEn ?? s0.nameAr ?? 'Not provided',
    supSize: s0.size ? String(s0.size) : 'Not specified',
    cost: s0.netCost ?? 'Not provided',
    supId: sp.id,
    mktId: mp.id,
    mktName: l0.name,
    mktSize: mp.size ?? 'Not shown by store',
    stores: [...mp.perStore.values()].map((l) => l.storeName).join(', '),
    prices: [...mp.perStore.values()].map((l) => l.price.toFixed(2)).join(' / '),
    url: link(l0.url),
    cover: Math.round(rv.cover * 100) / 100,
    reason: rv.reason,
    decision: 'To be confirmed by LOOKS',
  })
  reviewRows++
}
if (!reviewRows) mr.addRow({ supplier: 'None', code: 'None', supName: 'No uncertain matches', supSize: '—', cost: 0, supId: '—', mktId: '—', mktName: '—', mktSize: '—', stores: '—', prices: '—', url: '—', cover: 0, reason: '—', decision: '—' })
mr.getColumn(15).eachCell((cell, rn) => rn > 1 && (cell.fill = PINK))

/* ---- Supplier Summary (which supplier lists are worth buying from) ---- */

const ss = sheet('Supplier Summary', [
  { header: 'Supplier', key: 'supplier', width: 22 },
  { header: 'Items in price list', key: 'items', width: 11 },
  { header: 'Found online (exact match)', key: 'found', width: 12 },
  { header: '…of which at 2+ stores', key: 'multi', width: 12 },
  { header: 'Matched by barcode', key: 'bar', width: 11 },
  { header: 'Matched by name + size', key: 'name', width: 11 },
  { header: 'Possible matches waiting for review', key: 'review', width: 13 },
  { header: 'Not found at collected stores (use search links)', key: 'notFound', width: 15 },
  { header: 'Median gross margin of found items', key: 'medGm', width: 12, style: { numFmt: PCT } },
  { header: 'Items with margin ≥ 35%', key: 'good', width: 11 },
  { header: 'Items with negative margin', key: 'neg', width: 11 },
  { header: 'Stores where found', key: 'stores', width: 50 },
])
const bySupplier = new Map()
for (const { p, sr } of supRowsAll) {
  const k = sr.supplier
  const b = bySupplier.get(k) ?? { supplier: k, items: 0, found: 0, multi: 0, bar: 0, name: 0, review: 0, notFound: 0, gms: [], stores: new Set() }
  b.items++
  if (p.storesFound) {
    b.found++
    if (p.storesFound >= 2) b.multi++
    if (/Barcode/.test(p.method)) b.bar++
    else b.name++
    if (p.avgEx && sr.netCost) b.gms.push((p.avgEx - sr.netCost) / p.avgEx)
    p.perStore.forEach((l) => b.stores.add(l.storeName))
  } else {
    b.notFound++
    if (p.flags.some((f) => f.startsWith('Possible store match'))) b.review++
  }
  bySupplier.set(k, b)
}
for (const b of bySupplier.values()) {
  const g = [...b.gms].sort((x, y) => x - y)
  const med = !g.length ? 'No market prices' : g.length % 2 ? g[(g.length - 1) / 2] : (g[g.length / 2 - 1] + g[g.length / 2]) / 2
  ss.addRow({ ...b, medGm: typeof med === 'number' ? Math.round(med * 1000) / 1000 : med, good: b.gms.filter((x) => x >= 0.35).length, neg: b.gms.filter((x) => x < 0).length, stores: [...b.stores].join(', ') || 'None of the collected stores' })
}

/* ---- Quick Lookup (type an ID / barcode / supplier code → every store price, links, margins) ---- */

const ql = wb.addWorksheet('Quick Lookup', { properties: { tabColor: { argb: 'FFB76E79' } } })
ql.getColumn(1).width = 44
ql.getColumn(2).width = 30
ql.getColumn(3).width = 60
const MC = `'Master Catalog'!`
const mcCol = (k) => `${MC}$${colLetter(k)}:$${colLetter(k)}`
const demoPick = products.filter((p) => p.supplier && p.storesFound >= 2).sort((a, b) => b.storesFound - a.storesFound)[0] ?? products.find((p) => p.supplier && p.storesFound) ?? products[0]
const title = ql.addRow(['LOOKS Quick Lookup — compare one product across Saudi stores'])
title.getCell(1).font = { bold: true, size: 15, color: { argb: 'FFB76E79' } }
ql.addRow(['Type a LOOKS ID, barcode (EAN) or supplier code in the pink cell. Optionally enter your own supplier cost. Everything below updates automatically.'])
ql.addRow([])
const inRow = ql.addRow(['LOOKS ID, barcode or supplier code', demoPick?.id ?? ''])
const costRow = ql.addRow(['Your supplier cost (SAR excl. VAT) — optional, overrides the price-list cost', ''])
for (const r of [inRow, costRow]) {
  r.getCell(2).fill = PINK
  r.getCell(2).font = { bold: true }
  r.getCell(1).font = { bold: true }
}
const IN = '$B$4'
const COSTIN = '$B$5'
ql.addRow([])
const idxRow = ql.addRow(['Row found in Master Catalog'])
const IDX = `$B$${idxRow.number}`
idxRow.getCell(2).value = { formula: `IFERROR(MATCH(""&${IN},${mcCol('id')},0),IFERROR(MATCH(""&${IN},${mcCol('barcode')},0),IFERROR(MATCH(""&${IN},${mcCol('code')},0),"Not found — check the code")))` }
const get = (k) => `INDEX(${mcCol(k)},${IDX})`
const fieldRows = [
  ['LOOKS ID', 'id'],
  ['Brand', 'brand'],
  ['Product name (English)', 'nameEn'],
  ['Product name (Arabic)', 'nameAr'],
  ['Size / volume', 'size'],
  ['Variant / shade', 'variant'],
  ['Barcode (EAN)', 'barcode'],
  ['Supplier code / SKU', 'code'],
  ['LOOKS category', 'subEn'],
  ['Match confidence', 'confidence'],
  ['Data status', 'status'],
  ['Flags / notes', 'flags'],
]
for (const [label, k] of fieldRows) {
  const r = ql.addRow([label])
  r.getCell(2).value = { formula: `IFERROR(${get(k)},"—")` }
}
ql.addRow([])
const h1 = ql.addRow(['Store', 'Price (SAR incl. VAT)', 'Product page'])
h1.eachCell((c) => ((c.fill = HEADER_FILL), (c.font = HEADER_FONT)))
for (const st of activeStores) {
  const r = ql.addRow([st.name])
  r.getCell(2).value = { formula: `IFERROR(${get(`p_${st.id}`)},"—")` }
  r.getCell(2).numFmt = MONEY
  r.getCell(3).value = { formula: `IFERROR(${LINKOUT(get(`u_${st.id}`), 'Open product page')},"—")` }
}
for (const [label, k] of [
  ['Amazon.sa (not collected — terms of use; check manually, seller shown on page)', 'q_amazon'],
  ['Noon (not collected — terms of use; check manually, seller shown on page)', 'q_noon'],
  ['Golden Scent / Sephora / Al-Dawaa / brand store (check manually)', 'q_other'],
]) {
  const r = ql.addRow([label, 'Manual check'])
  r.getCell(3).value = { formula: `IFERROR(${LINKOUT(get(k), 'Search for this product')},"—")` }
}
ql.addRow([])
const h2 = ql.addRow(['Market summary & margin', 'Value'])
h2.eachCell((c) => ((c.fill = HEADER_FILL), (c.font = HEADER_FONT)))
const sumRows = {}
for (const [label, k, fmt] of [
  ['Stores found', 'storesFound'],
  ['Lowest market price (SAR incl. VAT)', 'min', MONEY],
  ['Lowest price at', 'lowestStore'],
  ['Highest market price (SAR incl. VAT)', 'max', MONEY],
  ['Average market price (SAR incl. VAT)', 'avg', MONEY],
  ['Median market price (SAR incl. VAT)', 'median', MONEY],
  ['Supplier (price list)', 'supplier'],
  ['Supplier net cost from price list (SAR excl. VAT)', 'cost', MONEY],
]) {
  const r = ql.addRow([label])
  r.getCell(2).value = { formula: `IFERROR(${get(k)},"—")` }
  if (fmt) r.getCell(2).numFmt = fmt
  sumRows[k] = `$B$${r.number}`
}
const used = ql.addRow(['Supplier cost used for margins (SAR excl. VAT)'])
used.getCell(2).value = { formula: `IF(${COSTIN}<>"",${COSTIN},${sumRows.cost})` }
used.getCell(2).numFmt = MONEY
const C = `$B$${used.number}`
const need = '"Needs market price & supplier cost"'
for (const [label, price] of [
  ['at the lowest market price', sumRows.min],
  ['at the average market price', sumRows.avg],
  ['at the highest market price', sumRows.max],
]) {
  const r1 = ql.addRow([`Gross profit per unit ${label} (SAR excl. VAT)`])
  r1.getCell(2).value = { formula: `IFERROR(${price}/(1+${VAT})-${C},${need})` }
  r1.getCell(2).numFmt = MONEY
  const r2 = ql.addRow([`Gross margin ${label}`])
  r2.getCell(2).value = { formula: `IFERROR((${price}/(1+${VAT})-${C})/(${price}/(1+${VAT})),${need})` }
  r2.getCell(2).numFmt = PCT
}
ql.addRow([])
ql.addRow(['Note', 'Market prices include 15% VAT; supplier costs exclude VAT. Profit = market price ÷ 1.15 − supplier cost. Nothing is estimated: if a store does not list the product the cell says so.'])
ql.eachRow((r) => {
  r.getCell(2).alignment = { wrapText: true, vertical: 'top' }
  r.getCell(1).alignment = { wrapText: true, vertical: 'top' }
})

/* ---- Demo — supplier products with verified prices from several Saudi retailers ---- */

const demo = wb.addWorksheet('Demo — 10 Products', { properties: { tabColor: { argb: 'FF7A5A26' } } })
demo.getColumn(1).width = 30
for (let i = 2; i <= 6; i++) demo.getColumn(i).width = 22
const dTitle = demo.addRow(['Demonstration — supplier products compared across Saudi retailers (verified live prices)'])
dTitle.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFB76E79' } }
demo.addRow(['Each block: supplier cost (VAT-excl.) and the exact same product (same barcode, or same brand + size + name) at each Saudi store, with direct links. Margin = price ÷ 1.15 − cost.'])
const multiSup = products.filter((p) => p.supplier && p.storesFound >= 2).sort((a, b) => b.storesFound - a.storesFound || (b.avgEx - b.supplier.netCost) / b.avgEx - (a.avgEx - a.supplier.netCost) / a.avgEx)
const keuneFound = products.filter((p) => p.supplier && p.storesFound && /keune/i.test(p.supplier.supplier)).sort((a, b) => b.avg - a.avg)
const demoBlocks = [...multiSup.slice(0, 15), ...keuneFound.slice(0, 5)]
let blockNo = 0
for (const p of demoBlocks) {
  demo.addRow([])
  const hb = demo.addRow([`${++blockNo}. ${p.brand} — ${p.nameEn ?? p.nameAr} (${p.size ?? 'size not specified'})`])
  hb.getCell(1).font = { bold: true, size: 12 }
  demo.addRow(['LOOKS ID', p.id, 'Barcode', p.barcode ?? NA.noBarcode, 'Match confidence', p.confidence])
  const cr = demo.addRow(['Supplier', `${p.supplier.supplier} (code ${p.supplier.supplierCode ?? 'n/a'})`, 'Net cost (SAR excl. VAT)', p.supplier.netCost])
  cr.getCell(4).numFmt = MONEY
  const costRef = `$D$${cr.number}`
  const th = demo.addRow(['Store', 'Price (SAR incl. VAT)', 'Price excl. VAT', 'Gross profit (SAR)', 'Gross margin', 'Product page'])
  th.eachCell((c) => ((c.fill = HEADER_FILL), (c.font = HEADER_FONT)))
  for (const l of [...p.perStore.values()].sort((a, b) => a.price - b.price)) {
    const r = demo.addRow([l.storeName, l.price])
    const R = r.number
    r.getCell(2).numFmt = MONEY
    r.getCell(3).value = { formula: `B${R}/(1+${VAT})` }
    r.getCell(3).numFmt = MONEY
    r.getCell(4).value = { formula: `C${R}-${costRef}` }
    r.getCell(4).numFmt = MONEY
    r.getCell(5).value = { formula: `IFERROR(D${R}/C${R},"—")` }
    r.getCell(5).numFmt = PCT
    r.getCell(6).value = { text: 'Open', hyperlink: l.url }
  }
  const sm = demo.addRow(['Lowest / Average / Highest (SAR incl. VAT)', p.min, p.avg, p.max, `Lowest at ${p.lowestStore}`])
  ;[2, 3, 4].forEach((i) => (sm.getCell(i).numFmt = MONEY))
  const mk = demo.addRow(['Amazon.sa / Noon / other stores (manual check)', 'Amazon.sa', 'Noon', 'Other stores'])
  mk.getCell(2).value = { text: 'Search Amazon.sa', hyperlink: searchUrl('amazon', p) }
  mk.getCell(3).value = { text: 'Search Noon', hyperlink: searchUrl('noon', p) }
  mk.getCell(4).value = { text: 'Search other stores', hyperlink: searchUrl('other', p) }
}
if (!demoBlocks.length) demo.addRow(['No supplier product was found at two or more collected stores.'])
demo.addRow([])
demo.addRow([`Products 1–${Math.min(15, multiSup.length)}: supplier items found at 2+ Saudi stores. ${keuneFound.length ? `Last ${Math.min(5, keuneFound.length)}: Keune items — among the stores that allow collection Keune is sold only by Looieen, so other sellers (Keune Saudi, Amazon.sa, Noon) are given as search links.` : ''}`])


/* ---- Brands ---- */

const brandAgg = new Map()
for (const p of products) {
  const b = brandAgg.get(p.brandKey || p.brand) ?? { brand: p.brand, products: 0, withPrices: 0, multi: 0, withCost: 0, stores: new Set() }
  b.products++
  if (p.storesFound) b.withPrices++
  if (p.storesFound >= 2) b.multi++
  if (p.supplier) b.withCost++
  p.perStore.forEach((_, sid) => b.stores.add(sid))
  brandAgg.set(p.brandKey || p.brand, b)
}
const bs = sheet('Brands', [
  { header: 'Brand', key: 'brand', width: 28 },
  { header: 'Products', key: 'products', width: 10 },
  { header: 'With market price', key: 'withPrices', width: 12 },
  { header: 'Found at 2+ stores', key: 'multi', width: 12 },
  { header: 'With supplier cost', key: 'withCost', width: 12 },
  { header: 'Stores carrying the brand', key: 'stores', width: 60 },
])
;[...brandAgg.values()]
  .sort((a, b) => b.products - a.products)
  .forEach((b) => bs.addRow({ ...b, stores: [...b.stores].map((id) => STORES.find((s) => s.id === id)?.name ?? id).join(', ') || 'Supplier list only' }))

/* ---- Store Coverage ---- */

const cov = sheet('Store Coverage', [
  { header: 'Store', key: 'store', width: 16 },
  { header: 'Website', key: 'url', width: 32 },
  { header: 'Collection status', key: 'status', width: 34 },
  { header: 'Listings collected', key: 'n', width: 12 },
  { header: 'Matched to products found elsewhere', key: 'matched', width: 14 },
  { header: 'With barcode', key: 'bar', width: 11 },
  { header: 'Method / notes', key: 'notes', width: 90 },
])
for (const s of STORES) {
  const rep = reports[s.id]
  const mine = listings.filter((l) => l.storeId === s.id)
  const matched = products.filter((p) => p.perStore.has(s.id) && p.storesFound >= 2).length
  cov.addRow({
    store: s.name,
    url: { text: s.url, hyperlink: s.url },
    status: s.excluded ? 'Excluded' : rep?.blocked ? 'Blocked by site protection' : mine.length ? 'Collected' : 'Not collected',
    n: mine.length,
    matched,
    bar: mine.filter((l) => l.barcode).length,
    notes: s.excluded ?? (rep ? [rep.method, rep.notes].filter(Boolean).join(' — ') : 'No collection report available'),
  })
}

/* ---- Data Issues ---- */

const di = sheet('Data Issues', [
  { header: 'Type', key: 'type', width: 26 },
  { header: 'Source', key: 'source', width: 16 },
  { header: 'Reference', key: 'ref', width: 20 },
  { header: 'Detail', key: 'detail', width: 90 },
])
const ISSUE_LABEL = { missing_code: 'Missing product code', duplicate_code: 'Duplicate product code', missing_barcode: 'Missing barcode', discontinued: 'Discontinued item', duplicate_barcode: 'Duplicate barcode', missing_cost: 'Missing cost (row skipped — not estimated)', missing_brand: 'Missing brand' }
for (const i of supplierIssues)
  di.addRow({
    type: ISSUE_LABEL[i.type] ?? i.type,
    source: `${i.supplier} price list`,
    ref: i.code || i.barcode || (i.page ? `Page ${i.page}` : 'Not available'),
    detail: i.names ? `Used for: ${i.names.join(' / ')}` : (i.name || 'Not available') + (i.page ? ` (page ${i.page})` : ''),
  })
for (const p of products) for (const f of p.flags) if (!/discontinued|Supplier marketing/.test(f)) di.addRow({ type: f.startsWith('Category') ? 'Category needs review' : f.startsWith('Price spread') ? 'Price spread — verify match' : 'Product note', source: 'Master Catalog', ref: p.id, detail: `${p.brand} — ${p.nameEn ?? p.nameAr}: ${f}` })

/* ---- Read Me (first sheet) ---- */

const rm = wb.addWorksheet('Read Me', { properties: { tabColor: { argb: 'FFB76E79' } } })
rm.getColumn(1).width = 34
rm.getColumn(2).width = 110
const storesCollected = STORES.filter((s) => listings.some((l) => l.storeId === s.id))
const lines = [
  ['LOOKS — Saudi Beauty Market Master Catalog', ''],
  ['Prepared', TODAY],
  ['Purpose', 'Master product catalog for LOOKS: product identity, Saudi online market prices, supplier purchase costs and margins. Structured for direct import into the LOOKS website/admin (all products start inactive).'],
  ['Products', `${products.length.toLocaleString('en-US')} unique products (rows in "Master Catalog")`],
  ['Market listings', `${listings.length.toLocaleString('en-US')} store listings from ${storesCollected.length} stores (${storesCollected.map((s) => s.name).join(', ') || 'none'})`],
  ['Supplier price lists', `${suppliers.length.toLocaleString('en-US')} supplier items (${[...new Set(suppliers.map((s) => s.supplier))].join(', ')}). Further supplier quotations will be added as received.`],
  ['', ''],
  ['Sheets', 'Quick Lookup → type any LOOKS ID / barcode / supplier code and see every store price, links, lowest/average/highest and your margin. Demo — 10 Products → worked examples. Master Catalog → all products. Supplier vs Market → every supplier item with all store prices, links and margins, ranked by margin. Supplier Summary → coverage and margins per supplier. Match Review → possible matches that were NOT combined (please confirm). Market Listings → every store listing. Supplier Costs, Brands, Store Coverage, Data Issues.'],
  ['Supplier coverage', [...new Set(suppliers.map((x) => x.supplier))].map((name) => { const rows = products.filter((p) => p.supplierRows.some((r) => r.supplier === name)); const items = suppliers.filter((x) => x.supplier === name).length; const found = rows.filter((p) => p.storesFound).length; const multi = rows.filter((p) => p.storesFound >= 2).length; return `${name}: ${items} items — ${found} found online with verified prices${multi ? ` (${multi} at 2+ stores)` : ''}` }).join(' | ')],
  ['Match confidence', '"High — same barcode": identical EAN at both sources. "Medium": same brand, identical size, same product type and the same product-line words (e.g. supplier "CARE KERATIN SMOO CONDITIONER 250ml" = store "بلسم كيراتين سموث 250 مل كيون"). Shades/numbers must be identical (7/7 never matches 7/89). Anything less certain is NOT combined — it is listed in "Match Review" for a quick yes/no.'],
  ['Amazon.sa & Noon', 'Their terms of use prohibit automated price collection, so their prices are not copied into this file. Every product has a one-click search link for Amazon.sa and Noon (by barcode where available) where the current price and the seller name are shown. Automatic Amazon/Noon prices and seller names require their official seller/partner APIs (Amazon Selling Partner API, Noon partner access) with a LOOKS seller account.'],
  ['Brand names', 'Store spellings are unified before matching: "KEUNE CARE" / "كيون كير" = Keune, "La Rouche Posay" = La Roche-Posay, "Nivea Men" = Nivea, etc., so supplier lists match store listings even when the brand is written differently.'],
  ['How to use', '1) Filter "Master Catalog" by brand/category. 2) Review market prices and supplier cost. 3) Enter your price in the pink column "LOOKS selling price (SAR incl. VAT)" — LOOKS profit and margin recalculate automatically. 4) Approve products for activation.'],
  ['VAT', 'Market prices are VAT-inclusive (as shown to Saudi shoppers). Supplier costs are VAT-exclusive. All profit and margin figures compare VAT-exclusive values: market or LOOKS price ÷ 1.15 minus supplier net cost.'],
  ['Average market price', 'Simple average of verified prices from the stores where the product was found (one price per store). Never estimated: if a product was not found online, the price columns say "Not found". The median is also shown because one store running a clearance or a very high price can pull the average; when lowest and highest differ by more than 2.5× the row is flagged "verify match".'],
  ['Supplier cost', 'Only from supplier price lists provided by LOOKS. Wella = WSP (net salon price after discount); Keune = salon list price × (1 − discount). Products without a supplier list show "Not provided by supplier yet".'],
  ['Data status', '"Verified — N stores": price confirmed on N live product pages. "Verified — single store": found at one store only. "Supplier only": in a supplier list but not found at the collected stores.'],
  ['Match method', '"Barcode": same EAN across sources (most reliable). "Name + size": same brand, identical size and near-identical name with identical shade numbers. "Single listing": not matched to another source.'],
  ['Images & descriptions', 'Image references link to the image on the source store for identification only. They belong to the brand/store and must NOT be published until authorized — request official image and content packs from the authorized Saudi distributors, or create original LOOKS content.'],
  ['Empty values', 'There are no blank cells: every missing value states the reason (e.g. "Not listed at this store", "Not published by source", "Store not accessible").'],
  ['Stores not collected', STORES.filter((s) => s.excluded || reports[s.id]?.blocked).map((s) => `${s.name}: ${s.excluded ?? 'blocked by the site’s bot protection (not bypassed)'}`).join(' | ') || 'None'],
  ['Data issues', 'See the "Data Issues" sheet: missing/duplicate supplier codes, missing barcodes, discontinued items, products whose category or match should be reviewed.'],
  ['Refreshing prices', 'Prices were read from public product pages on the collection date shown per product. They can be refreshed with the LOOKS collectors (server/market-data). Competitor price updates never change LOOKS selling prices.'],
]
lines.forEach(([a, b], i) => {
  if (!b && b !== '') b = 'Not available'
  const row = rm.addRow([a, b])
  row.getCell(1).font = { bold: true, color: { argb: i === 0 ? 'FFB76E79' : 'FF2A1E22' }, size: i === 0 ? 16 : 11 }
  row.getCell(2).alignment = { wrapText: true, vertical: 'top' }
  row.getCell(1).alignment = { vertical: 'top' }
})

// Sheet order: guidance and tools first, then data
const ORDER = ['Read Me', 'Quick Lookup', 'Demo — 10 Products', 'Master Catalog', 'Supplier vs Market', 'Supplier Summary', 'Match Review', 'Market Listings', 'Supplier Costs', 'Brands', 'Store Coverage', 'Data Issues']
wb.eachSheet((w) => {
  const i = ORDER.indexOf(w.name)
  w.orderNo = i < 0 ? 100 + w.id : i
})

/* ---------------- Write outputs ---------------- */

fs.mkdirSync(path.join(ROOT, 'output'), { recursive: true })
const xlsx = path.join(ROOT, 'output', `LOOKS-Master-Catalog-${TODAY}.xlsx`)
await wb.xlsx.writeFile(xlsx)

// Website/admin import file (one object per product; same fields as the sheet)
const importRows = products.map((p) => ({
  id: p.id,
  status: 'inactive',
  brand: p.brand,
  nameEn: p.nameEn,
  nameAr: p.nameAr,
  category: p.category.main,
  subcategory: p.category.sub,
  productLine: p.productLine,
  size: p.size,
  variant: p.variant,
  barcode: p.barcode,
  supplierCode: p.supplierCode,
  marketPrices: [...p.perStore.values()].map((l) => ({ store: l.storeName, price: l.price, originalPrice: l.originalPrice, url: l.url, verifiedAt: l.collectedAt })),
  averageMarketPrice: p.avg,
  supplier: p.supplier ? { name: p.supplier.supplier, listPrice: p.supplier.listPrice, discount: p.supplier.discount, netCost: p.supplier.netCost } : null,
  looksPrice: null,
  imageReference: p.imageRef,
  imageRights: p.imageRef ? 'pending_authorization' : 'missing',
  dataStatus: p.status,
  matchMethod: p.method,
  matchConfidence: p.confidence,
  checkPriceLinks: { amazon: searchUrl('amazon', p), noon: searchUrl('noon', p), other: searchUrl('other', p) },
  supplierOffers: p.supplierRows.map((x) => ({ name: x.supplier, code: x.supplierCode, netCost: x.netCost })),
  flags: p.flags,
}))
fs.writeFileSync(path.join(ROOT, 'output', 'master-catalog.json'), JSON.stringify(importRows))

const s = (f) => products.filter(f).length
console.log(`\nWROTE ${xlsx}`)
console.log({
  products: products.length,
  multiStore: s((p) => p.storesFound >= 2),
  singleStore: s((p) => p.storesFound === 1),
  supplierOnly: s((p) => !p.storesFound && p.supplier),
  withCost: s((p) => p.supplier),
  withCostAndMarket: s((p) => p.supplier && p.storesFound),
  byBarcode: s((p) => p.method === 'Barcode'),
  byName: s((p) => p.method === 'Name + size'),
  supplierByName: s((p) => p.method === 'Supplier name + size'),
  supplierMulti: s((p) => p.supplier && p.storesFound >= 2),
  keuneFound: s((p) => p.supplier && p.storesFound && /keune/i.test(p.supplier.supplier)),
  wellaFound: s((p) => p.supplier && p.storesFound && /wella/i.test(p.supplier.supplier)),
  reviewRows,
  categoryReview: s((p) => !p.category.confident),
  priceSpreadFlags: s((p) => p.flags.some((f) => f.startsWith('Price spread'))),
})
