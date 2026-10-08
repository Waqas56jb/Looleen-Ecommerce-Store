/**
 * Import a new supplier price list (Excel .xlsx or .csv) so the next build matches it
 * automatically against every collected Saudi store listing.
 *
 *   node scripts/add_supplier.mjs <file.xlsx|file.csv> --supplier "Supplier name" [--brand "Brand"] [--discount 0.25] [--sheet "Sheet1"]
 *   node --max-old-space-size=6144 scripts/build_master.mjs
 *
 * Columns are detected from the header row (English or Arabic), e.g.:
 *   code / item code / SKU / رمز · barcode / EAN / باركود · name / description / الاسم ·
 *   Arabic name · brand / الماركة · size / volume / الحجم · list price / RSP / السعر ·
 *   discount / خصم · net price / WSP / cost / التكلفة
 * Costs must be VAT-exclusive (as on supplier price lists). Nothing is estimated:
 * a row without a cost is reported as an issue, not guessed.
 * Output: suppliers/<supplier-slug>.json (same format as the Keune/Wella lists).
 */
import fs from 'node:fs'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { hasArabic, normalizeBarcode, parsePrice, parseSize, ROOT } from '../lib/record.mjs'

const args = process.argv.slice(2)
const opt = (k) => {
  const i = args.indexOf(`--${k}`)
  return i >= 0 ? args[i + 1] : null
}
const file = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--') && fs.existsSync(a))
const supplier = opt('supplier')
if (!file || !supplier) {
  console.error('usage: node scripts/add_supplier.mjs <file.xlsx|file.csv> --supplier "Name" [--brand "Brand"] [--discount 0.25] [--sheet "Sheet1"]')
  process.exit(1)
}
const defaultBrand = opt('brand')
const defaultDiscount = opt('discount') ? Number(opt('discount')) : null

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) {
      if (ch === '"' && text[i + 1] === '"') (cell += '"'), i++
      else if (ch === '"') q = false
      else cell += ch
    } else if (ch === '"') q = true
    else if (ch === ',' || ch === ';' || ch === '\t') row.push(cell), (cell = '')
    else if (ch === '\n') row.push(cell), rows.push(row), (row = []), (cell = '')
    else if (ch !== '\r') cell += ch
  }
  if (cell || row.length) row.push(cell), rows.push(row)
  return rows
}

async function readRows() {
  if (/\.csv$/i.test(file)) return parseCsv(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''))
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(file)
  const ws = opt('sheet') ? wb.getWorksheet(opt('sheet')) : wb.worksheets[0]
  const out = []
  ws.eachRow({ includeEmpty: false }, (r) => out.push(r.values.slice(1).map((v) => (v && typeof v === 'object' ? (v.result ?? v.text ?? v.richText?.map((t) => t.text).join('') ?? '') : (v ?? '')))))
  return out
}

const HEAD = {
  code: /^(item\s*)?(code|no\.?|number|sku|ref|reference|article)|رمز|كود|الكود/i,
  barcode: /barcode|ean|gtin|upc|باركود/i,
  nameAr: /arabic|عربي|الاسم\s*بالعربي/i,
  name: /name|description|product|item|desc|الاسم|المنتج|الوصف/i,
  brand: /brand|ماركة|الماركة|العلامة/i,
  size: /size|volume|ml|content|الحجم|السعة/i,
  discount: /disc|خصم/i,
  net: /net|wsp|cost|purchase|salon|wholesale|التكلفة|الصافي|الجملة/i,
  list: /list|rsp|price|retail|السعر/i,
  line: /line|range|series|collection|category|الفئة|المجموعة/i,
}

const rows = await readRows()
const headerAt = rows.findIndex((r) => r.filter((c) => String(c).trim()).length >= 2 && r.some((c) => HEAD.name.test(String(c))))
if (headerAt < 0) {
  console.error('Could not find a header row with a product name column.')
  process.exit(1)
}
const header = rows[headerAt].map((c) => String(c).trim())
const col = {}
for (const [k, re] of Object.entries(HEAD))
  header.forEach((h, i) => {
    if (col[k] !== undefined || !h || !re.test(h)) return
    if (Object.values(col).includes(i)) return
    col[k] = i
  })
console.log('detected columns:', Object.fromEntries(Object.entries(col).map(([k, i]) => [k, header[i]])))

const items = []
const issues = []
const seenCodes = new Map()
rows.slice(headerAt + 1).forEach((r, n) => {
  const get = (k) => (col[k] === undefined ? '' : String(r[col[k]] ?? '').trim())
  const rawName = get('name')
  if (!rawName) return
  const rowNo = headerAt + n + 2
  const nameAr = get('nameAr') || (hasArabic(rawName) ? rawName : null)
  const nameEn = hasArabic(rawName) ? null : rawName
  const listPrice = parsePrice(get('list'))
  const discount = get('discount') ? (parsePrice(get('discount')) > 1 ? parsePrice(get('discount')) / 100 : parsePrice(get('discount'))) : defaultDiscount
  let netCost = parsePrice(get('net'))
  let priceBasis = 'Net purchase price from supplier list (SAR excl. VAT)'
  if (!netCost && listPrice) {
    netCost = Math.round(listPrice * (1 - (discount ?? 0)) * 100) / 100
    priceBasis = discount ? `List price × (1 − ${Math.round(discount * 100)}% discount) (SAR excl. VAT)` : 'List price (SAR excl. VAT), no discount stated'
  }
  const sz = parseSize(get('size')) ?? parseSize(rawName)
  const code = get('code') || null
  const barcode = normalizeBarcode(get('barcode')) ?? null
  const item = {
    supplier,
    brand: get('brand') || defaultBrand || null,
    supplierCode: code,
    barcode,
    nameEn,
    nameAr,
    productLine: get('line') || null,
    size: sz ? `${sz.value}${sz.unit}` : get('size') || null,
    listPrice: listPrice ?? null,
    discount: discount ?? 0,
    netCost: netCost ?? null,
    priceBasis,
    discontinued: /\bdisc(ontinued)?\b|متوقف/i.test(r.join(' ')),
    sourcePage: rowNo,
  }
  if (!item.brand) issues.push({ type: 'missing_brand', name: rawName, page: rowNo })
  if (!code) issues.push({ type: 'missing_code', name: rawName, page: rowNo })
  if (!barcode) issues.push({ type: 'missing_barcode', name: rawName, page: rowNo })
  if (!netCost) {
    issues.push({ type: 'missing_cost', name: rawName, page: rowNo })
    return // never estimate a cost
  }
  if (code) {
    if (seenCodes.has(code)) issues.push({ type: 'duplicate_code', code, names: [seenCodes.get(code), rawName] })
    else seenCodes.set(code, rawName)
  }
  items.push(item)
})

const slug = supplier.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'supplier'
const out = path.join(ROOT, 'suppliers', `${slug}.json`)
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, JSON.stringify({ supplier, source: path.basename(file), importedAt: new Date().toISOString(), items, issues }, null, 1))
console.log(`wrote ${out}: ${items.length} items, ${issues.length} issues (${[...new Set(issues.map((i) => i.type))].join(', ') || 'none'})`)
console.log('Next: node --max-old-space-size=6144 scripts/build_master.mjs  — the new list is matched automatically.')
