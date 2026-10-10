/**
 * Build the manual price-verification checklist for the admin demo products:
 * one row per product × retailer that does not allow automated collection
 * (Amazon.sa, Noon, brand store, Al-Dawaa, Sephora, Golden Scent), with a
 * direct search link and empty cells for what the checker sees on the live page.
 *
 *   node scripts/manual_checklist.mjs
 *   → output/LOOKS-Manual-Price-Checklist.xlsx
 * After filling it in: node scripts/import_manual_prices.mjs output/LOOKS-Manual-Price-Checklist.xlsx
 */
import fs from 'node:fs'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { ROOT } from '../lib/record.mjs'

const seedFile = path.resolve(ROOT, '..', '..', 'admin', 'src', 'data', 'seed', 'sourcing.data.ts')
const src = fs.readFileSync(seedFile, 'utf8')
const products = JSON.parse(src.slice(src.indexOf('= [') + 2).trim())
const MIN = 4

const google = (site, q) => `https://www.google.com/search?q=${encodeURIComponent(`site:${site} ${q}`)}`
const RETAILERS = [
  { id: 'amazon', name: 'Amazon.sa', url: (p, q) => `https://www.amazon.sa/s?k=${encodeURIComponent(p.barcode || q)}` },
  { id: 'noon', name: 'Noon', url: (p, q) => `https://www.noon.com/saudi-en/search/?q=${encodeURIComponent(q)}` },
  { id: 'keunesaudi', name: 'Keune Saudi (keunesaudi.com)', brand: 'Keune', url: (p, q) => google('keunesaudi.com', q) },
  { id: 'aldawaa', name: 'Al-Dawaa', url: (p, q) => google('al-dawaa.com', q) },
  { id: 'sephora', name: 'Sephora KSA', url: (p, q) => google('sephora.me', q) },
  { id: 'goldenscent', name: 'Golden Scent', url: (p, q) => google('goldenscent.com', q) },
]

const nice = (p) => {
  let n = p.nameEn === p.nameEn.toUpperCase() ? p.nameEn.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()) : p.nameEn
  if (!n.toLowerCase().startsWith(p.brand.split(' ')[0].toLowerCase())) n = `${p.brand} ${n}`
  return n
}

const wb = new ExcelJS.Workbook()
const ws = wb.addWorksheet('Checklist', { views: [{ state: 'frozen', ySplit: 1, xSplit: 3 }] })
ws.columns = [
  { header: 'LOOKS ID', key: 'id', width: 11 },
  { header: 'Product (exact size)', key: 'name', width: 44 },
  { header: 'Barcode (EAN)', key: 'barcode', width: 16 },
  { header: 'Verified now / needed', key: 'have', width: 12 },
  { header: 'Retailer', key: 'retailer', width: 24 },
  { header: 'Retailer ID', key: 'rid', width: 11 },
  { header: 'Search link (opens the store)', key: 'search', width: 18 },
  { header: 'Price shown (SAR incl. VAT)', key: 'price', width: 13 },
  { header: 'Price before discount (if shown)', key: 'orig', width: 13 },
  { header: 'Seller (Amazon/Noon: seller name on page)', key: 'seller', width: 22 },
  { header: 'In stock? (Yes/No)', key: 'stock', width: 10 },
  { header: 'Product page link (copy from browser)', key: 'url', width: 40 },
  { header: 'Same product? (Barcode / Name+size)', key: 'match', width: 14 },
  { header: 'Name as listed on the page', key: 'listed', width: 36 },
  { header: 'Checked on (YYYY-MM-DD)', key: 'date', width: 13 },
  { header: 'Checked by', key: 'by', width: 14 },
  { header: 'Note (e.g. not sold here)', key: 'note', width: 24 },
]
const head = ws.getRow(1)
head.eachCell((c, n) => {
  c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
  c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: n >= 8 ? 'FFB76E79' : 'FF2A1E22' } }
  c.alignment = { wrapText: true, vertical: 'middle' }
})
head.height = 42

let rows = 0
for (const p of products) {
  const have = new Set(p.prices.map((c) => c.retailerId)).size
  const q = `${nice(p)} ${p.size}`.replace(/\s+/g, ' ')
  for (const r of RETAILERS) {
    if (r.brand && !p.brand.includes(r.brand)) continue
    if (p.prices.some((c) => c.retailerId === r.id)) continue
    const row = ws.addRow({ id: p.id, name: `${nice(p)} — ${p.size}`, barcode: p.barcode, have: `${have} / ${MIN}`, retailer: r.name, rid: r.id, search: { text: 'Open search', hyperlink: r.url(p, q) } })
    for (let c = 8; c <= 17; c++) row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6E9EA' } }
    row.getCell(13).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Barcode,Name+size"'] }
    row.getCell(11).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Yes,No"'] }
    rows++
  }
}

const help = wb.addWorksheet('How to fill')
help.getColumn(1).width = 110
;[
  'LOOKS — manual price verification (Amazon.sa, Noon, brand store and other stores that do not allow automated collection)',
  '',
  '1. Click "Open search" in the row. Find the EXACT same product: same brand, same product line, same size (ml) and variant.',
  '2. Barcode: on Amazon open "Product information" / on Noon "Specifications" — if the barcode/EAN matches, choose "Barcode"; otherwise "Name+size".',
  '3. Copy the price shown (incl. VAT), the price before discount if shown, the seller name (Amazon: "Sold by …", Noon: "Sold by …"), stock and the page link.',
  '4. Enter today\'s date and your name. If the store does not sell this product, leave the price empty and write "Not sold here" in Note.',
  '5. Each product needs at least 4 different retailers in total ("Verified now / needed" shows how many it already has).',
  '6. Send the file back — it is imported into the LOOKS admin automatically (scripts/import_manual_prices.mjs). Never estimate a price.',
].forEach((t, i) => {
  const r = help.addRow([t])
  r.getCell(1).alignment = { wrapText: true }
  if (i === 0) r.getCell(1).font = { bold: true, size: 13 }
})

const out = path.join(ROOT, 'output', 'LOOKS-Manual-Price-Checklist.xlsx')
fs.mkdirSync(path.dirname(out), { recursive: true })
await wb.xlsx.writeFile(out)
console.log(`wrote ${out}: ${rows} rows for ${products.length} products`)
for (const p of products) console.log(`  ${p.id} ${nice(p)} ${p.size}: ${new Set(p.prices.map((c) => c.retailerId)).size}/${MIN} — needs ${Math.max(0, MIN - new Set(p.prices.map((c) => c.retailerId)).size)} more`)
