/**
 * Import a filled manual price checklist into manual/verified-prices.json,
 * then re-run export_admin_demo.mjs so the admin demo shows the prices
 * (marked "Manually verified", with seller, link, date and checker).
 *
 *   node scripts/import_manual_prices.mjs output/LOOKS-Manual-Price-Checklist.xlsx
 *
 * Rows without a price are skipped. A row with a price must have a seller,
 * an https link, a match type and a date — otherwise it is rejected (listed).
 */
import fs from 'node:fs'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { ROOT } from '../lib/record.mjs'

const file = process.argv[2]
if (!file) {
  console.error('usage: node scripts/import_manual_prices.mjs <checklist.xlsx>')
  process.exit(1)
}
const wb = new ExcelJS.Workbook()
await wb.xlsx.readFile(file)
const ws = wb.getWorksheet('Checklist')
const val = (c) => {
  const v = c.value
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  if (typeof v === 'object') return String(v.hyperlink ?? v.text ?? v.result ?? v.richText?.map((t) => t.text).join('') ?? '')
  return String(v).trim()
}

const out = []
const rejected = []
ws.eachRow((row, n) => {
  if (n === 1) return
  const g = (i) => val(row.getCell(i))
  const price = Number(g(8).replace(/[^0-9.]/g, ''))
  if (!price) return
  const rec = {
    looksId: g(1),
    retailerId: g(6),
    price,
    originalPrice: Number(g(9).replace(/[^0-9.]/g, '')) || null,
    seller: g(10),
    inStock: !/^no/i.test(g(11)),
    url: g(12),
    matchBy: /barcode/i.test(g(13)) ? 'barcode' : 'name_size',
    listedName: g(14) || g(2),
    verifiedAt: /^\d{4}-\d{2}-\d{2}/.test(g(15)) ? new Date(`${g(15).slice(0, 10)}T12:00:00+03:00`).toISOString() : '',
    verifiedBy: g(16) || 'LOOKS team',
    note: g(17),
  }
  const problems = [!rec.seller && 'seller', !/^https?:\/\//.test(rec.url) && 'product link', !g(13) && 'same-product check', !rec.verifiedAt && 'date'].filter(Boolean)
  if (problems.length) rejected.push(`row ${n} (${rec.looksId} ${g(5)}): missing ${problems.join(', ')}`)
  else out.push(rec)
})

const dest = path.join(ROOT, 'manual', 'verified-prices.json')
fs.mkdirSync(path.dirname(dest), { recursive: true })
const existing = fs.existsSync(dest) ? JSON.parse(fs.readFileSync(dest, 'utf8')) : []
// Newer check of the same product at the same retailer replaces the older one
const key = (r) => `${r.looksId}|${r.retailerId}`
const merged = new Map(existing.map((r) => [key(r), r]))
for (const r of out) merged.set(key(r), r)
fs.writeFileSync(dest, JSON.stringify([...merged.values()], null, 1))
console.log(`imported ${out.length} verified prices → ${dest} (${merged.size} total)`)
if (rejected.length) console.log(`rejected ${rejected.length}:\n  ${rejected.join('\n  ')}`)
console.log('Next: node --max-old-space-size=6144 scripts/export_admin_demo.mjs <the 10 LOOKS IDs>')
