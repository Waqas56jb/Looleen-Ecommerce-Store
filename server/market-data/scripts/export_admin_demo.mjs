/**
 * Export real demo products (supplier cost + collected Saudi retailer prices)
 * into the admin panel seed, for the Sourcing & Approval module.
 *
 *   node --max-old-space-size=6144 scripts/export_admin_demo.mjs LK-076738 LK-076744 …
 *
 * Reads output/master-catalog.json, suppliers/*.json and raw/<store>.jsonl.
 * Also adds, by identical barcode, listings from stores collected after the
 * master build (e.g. raw/keuneksa.jsonl), and manually verified prices from
 * manual/verified-prices.json (see scripts/import_manual_prices.mjs).
 * Writes admin/src/data/seed/sourcing.ts — it contains CONFIDENTIAL supplier
 * costs, so the admin repo must stay private.
 */
import fs from 'node:fs'
import path from 'node:path'
import { RAW_DIR, ROOT } from '../lib/record.mjs'

const ids = process.argv.slice(2)
if (!ids.length) {
  console.error('usage: node scripts/export_admin_demo.mjs <LOOKS ID> …')
  process.exit(1)
}
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'output', 'master-catalog.json'), 'utf8'))
const byId = new Map(catalog.map((p) => [p.id, p]))
const picked = ids.map((id) => byId.get(id) ?? (console.error(`not found: ${id}`), process.exit(1)))

// Full supplier rows (list price, discount, price basis, PDF page)
const supplierRows = fs
  .readdirSync(path.join(ROOT, 'suppliers'))
  .filter((f) => f.endsWith('.json'))
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'suppliers', f), 'utf8')).items)

// Raw listings by URL (stock, barcode, seller) — only for the picked products
const urls = new Set(picked.flatMap((p) => p.marketPrices.map((m) => m.url)))
const raw = new Map()
for (const f of fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.jsonl')))
  for (const line of fs.readFileSync(path.join(RAW_DIR, f), 'utf8').split('\n')) {
    if (!line.trim()) continue
    const r = JSON.parse(line)
    if (urls.has(r.url)) raw.set(r.url, r)
  }

const STORE_ID = {
  'Keune KSA (official)': 'keuneksa', Looieen: 'looieen', 'Nice One': 'niceone', Faces: 'faces', 'Nahdi Online': 'nahdi', Whites: 'whites', Watsons: 'watsons', 'Beauty Select': 'beautyselect', 'Cosmetics.sa': 'cosmeticssa', 'Kohl Al Ward': 'kohlalward' }

const EXTRA = ['keuneksa']
const extraStores = new Map(
  EXTRA.filter((sid) => fs.existsSync(path.join(RAW_DIR, `${sid}.jsonl`))).map((sid) => [
    sid,
    fs.readFileSync(path.join(RAW_DIR, `${sid}.jsonl`), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)),
  ]),
)
const manualFile = path.join(ROOT, 'manual', 'verified-prices.json')
const manual = fs.existsSync(manualFile) ? JSON.parse(fs.readFileSync(manualFile, 'utf8')) : []

const products = picked.map((p, i) => {
  const offers = p.supplierOffers.map((o) => {
    const full = supplierRows.find((s) => s.supplier === o.name && s.supplierCode === o.code && s.netCost === o.netCost) ?? {}
    return {
      supplierId: o.name.toLowerCase().includes('wella') ? 'sup-wella' : o.name.toLowerCase().includes('keune') ? 'sup-keune' : 'sup-other',
      code: o.code ?? '',
      nameOnList: full.nameEn ?? full.nameAr ?? p.nameEn,
      sizeOnList: full.size ? String(full.size) : (p.size ?? ''),
      listPrice: full.listPrice ?? null,
      discount: full.discount ?? 0,
      netCost: o.netCost,
      priceBasis: full.priceBasis ?? 'Supplier price list (SAR excl. VAT)',
      sourcePage: full.sourcePage ?? null,
    }
  })
  const prices = p.marketPrices.map((m, j) => {
    const r = raw.get(m.url) ?? {}
    return {
      id: `cp-${i + 1}-${j + 1}`,
      retailerId: STORE_ID[m.store] ?? m.store.toLowerCase(),
      price: m.price,
      originalPrice: m.originalPrice ?? null,
      seller: m.store,
      inStock: r.inStock !== false,
      url: m.url,
      source: 'automatic',
      matchBy: r.barcode && p.barcode && r.barcode === p.barcode ? 'barcode' : 'name_size',
      listedName: r.name ?? '',
      verifiedAt: m.verifiedAt,
      verifiedBy: 'LOOKS price collector',
    }
  })
  // Stores collected after the master build: add exact barcode matches
  if (p.barcode)
    for (const [sid, list] of extraStores) {
      if (prices.some((c) => c.retailerId === sid)) continue
      const hit = list.filter((r) => r.barcode === p.barcode).sort((a, b) => a.price - b.price)[0]
      if (hit)
        prices.push({ id: `cp-${i + 1}-${prices.length + 1}`, retailerId: sid, price: hit.price, originalPrice: hit.originalPrice ?? null, seller: hit.storeName, inStock: hit.inStock !== false, url: hit.url, source: 'automatic', matchBy: 'barcode', listedName: hit.name, verifiedAt: hit.collectedAt, verifiedBy: 'LOOKS price collector' })
    }
  // Manually verified prices (Amazon.sa, Noon, …) recorded by the LOOKS team
  for (const mv of manual.filter((m) => m.looksId === p.id)) {
    prices.push({ id: `cp-${i + 1}-${prices.length + 1}`, retailerId: mv.retailerId, price: mv.price, originalPrice: mv.originalPrice ?? null, seller: mv.seller, inStock: mv.inStock, url: mv.url, source: 'manual', matchBy: mv.matchBy, listedName: mv.listedName, verifiedAt: mv.verifiedAt, verifiedBy: mv.verifiedBy, note: mv.note || undefined })
  }
  return {
    id: p.id,
    brand: p.supplier.name.includes('Wella') ? 'Wella Professionals' : p.supplier.name.includes('Keune') ? 'Keune' : p.brand,
    nameEn: p.nameEn,
    nameAr: p.nameAr ?? '',
    size: p.size ?? '',
    barcode: p.barcode ?? '',
    categoryEn: 'Hair Care',
    categoryAr: 'العناية بالشعر',
    offers,
    prices,
  }
})

const out = path.resolve(ROOT, '..', '..', 'admin', 'src', 'data', 'seed', 'sourcing.data.ts')
const body = `/**
 * REAL demo data for the Sourcing & Approval module — generated by
 * server/market-data/scripts/export_admin_demo.mjs on ${new Date().toISOString().slice(0, 10)}.
 * Supplier costs come from the Wella / Keune price lists provided by LOOKS
 * (VAT-exclusive). Retailer prices were collected from public product pages
 * (VAT-inclusive). CONFIDENTIAL — keep this repository private.
 */
import type { SourcingSeedProduct } from '@/types/sourcing'

export const SOURCING_DATA: SourcingSeedProduct[] = ${JSON.stringify(products, null, 2)}
`
fs.writeFileSync(out, body)
console.log(`wrote ${out}: ${products.length} products, ${products.reduce((n, p) => n + p.prices.length, 0)} retailer prices`)
