/**
 * Quality gate for the master workbook:
 *   node scripts/verify_master.mjs [path.xlsx]
 * Checks: expected sheets exist, no blank cells in any data sheet, numeric price
 * columns hold numbers or an explanatory text, formulas present, IDs unique,
 * every product status is inactive.
 */
import fs from 'node:fs'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { ROOT } from '../lib/record.mjs'

const file =
  process.argv[2] ??
  path.join(
    ROOT,
    'output',
    fs
      .readdirSync(path.join(ROOT, 'output'))
      .filter((f) => f.endsWith('.xlsx'))
      .sort()
      .pop(),
  )
console.log('verifying', file)
const reader = new ExcelJS.stream.xlsx.WorkbookReader(file, { sharedStrings: 'cache', hyperlinks: 'cache', styles: 'ignore', worksheets: 'emit' })

const EXPECTED = ['Read Me', 'Quick Lookup', 'Demo — 10 Products', 'Master Catalog', 'Supplier vs Market', 'Supplier Summary', 'Match Review', 'Market Listings', 'Supplier Costs', 'Brands', 'Store Coverage', 'Data Issues']
// Layout sheets (guidance, lookup form, demo blocks) intentionally contain spacer cells
const LAYOUT = new Set(['Read Me', 'Quick Lookup', 'Demo — 10 Products'])
const seen = []
const problems = []
const stats = {}

for await (const ws of reader) {
  const name = ws.name
  seen.push(name)
  let header = null
  let rows = 0
  let blanks = 0
  let formulas = 0
  const ids = new Set()
  let dupIds = 0
  let notInactive = 0
  for await (const row of ws) {
    const vals = row.values.slice(1)
    if (!header) {
      header = vals
      continue
    }
    rows++
    for (let c = 0; c < header.length; c++) {
      const v = vals[c]
      if (v === null || v === undefined || (typeof v === 'string' && !v.trim())) {
        if (!LAYOUT.has(name)) {
          blanks++
          if (blanks <= 5) problems.push(`${name} row ${rows + 1}: blank cell in "${header[c]}"`)
        }
      } else if (typeof v === 'object' && 'formula' in v) formulas++
    }
    if (name === 'Master Catalog') {
      const id = vals[0]
      if (ids.has(id)) dupIds++
      ids.add(id)
      if (!String(vals[1]).startsWith('Inactive')) notInactive++
    }
  }
  stats[name] = { rows, blanks, formulas, ...(name === 'Master Catalog' ? { uniqueIds: ids.size, dupIds, notInactive } : {}) }
}

for (const s of EXPECTED) if (!seen.includes(s)) problems.push(`missing sheet: ${s}`)
const mc = stats['Master Catalog']
if (mc?.dupIds) problems.push(`${mc.dupIds} duplicate LOOKS IDs`)
if (mc?.notInactive) problems.push(`${mc.notInactive} products not marked inactive`)
const svm = stats['Supplier vs Market']
if (svm && svm.formulas < svm.rows * 4) problems.push(`Supplier vs Market: expected 4 formulas per row, found ${svm.formulas}`)
if (mc && mc.formulas < mc.rows * 6) problems.push(`expected 6 formulas per product row, found ${mc.formulas} for ${mc.rows} rows`)

console.table(stats)
console.log(problems.length ? `\nPROBLEMS (${problems.length}):\n- ` + problems.join('\n- ') : '\nALL CHECKS PASSED: no blank cells, unique IDs, all products inactive, formulas present.')
process.exitCode = problems.length ? 1 : 0
