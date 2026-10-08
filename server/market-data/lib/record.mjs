/**
 * Normalized market listing record + helpers shared by all collectors.
 *
 * Every collector writes raw/<storeId>.jsonl — one JSON object per line:
 * {
 *   storeId:        'looieen' | 'goldenscent' | ...            (required)
 *   storeName:      'Looieen'                                   (required)
 *   url:            canonical public product page URL           (required)
 *   storeProductId: store's own product/variant id              (required, string)
 *   name:           product name exactly as listed (any language) (required)
 *   nameEn:         English name if the store provides one, else null
 *   nameAr:         Arabic name if the store provides one, else null
 *   brand:          brand as listed by the store, else null
 *   category:       store category path, e.g. "Hair Care > Shampoo", else null
 *   variant:        variant/shade/colour label, else null
 *   size:           raw size text, e.g. "250ml", else null
 *   barcode:        EAN/UPC/GTIN digits if the store exposes it, else null
 *   sku:            store SKU / model code if exposed, else null
 *   price:          current selling price in SAR, VAT-inclusive, number (required)
 *   originalPrice:  pre-discount price in SAR if on sale, else null
 *   currency:       'SAR'
 *   inStock:        true | false | null
 *   imageUrl:       main product image URL (reference only — NOT for republishing), else null
 *   collectedAt:    ISO timestamp when this price was read from the live store (required)
 * }
 * Only factual, publicly displayed data is collected. No descriptions or images are copied.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
export const RAW_DIR = path.join(ROOT, 'raw')

const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/

export function hasArabic(s) {
  return !!s && ARABIC.test(s)
}

/** Split a mixed "Arabic + English" name into its two parts */
export function splitArEn(s) {
  if (!s) return { ar: null, en: null }
  const tokens = s.split(/\s+/)
  const ar = tokens.filter((t) => ARABIC.test(t)).join(' ').trim()
  const en = tokens.filter((t) => !ARABIC.test(t)).join(' ').replace(/^[\s\-|–—:]+|[\s\-|–—:]+$/g, '').trim()
  return { ar: ar || null, en: en || null }
}

/** "1,299.00 SAR" / "١٢٩٫٥٠" / 129.5 → 129.5 (null if not a positive number) */
export function parsePrice(v) {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null
  const s = String(v)
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/٫/g, '.')
    .replace(/[,\s]/g, '')
    .replace(/[^\d.]/g, '')
  const n = parseFloat(s)
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null
}

/** Valid EAN-8/12/13/14 checksum → normalized digits, else null */
export function normalizeBarcode(v) {
  if (!v) return null
  const d = String(v).replace(/\D/g, '')
  if (![8, 12, 13, 14].includes(d.length)) return null
  const digits = d.split('').map(Number)
  const check = digits.pop()
  const sum = digits.reverse().reduce((s, n, i) => s + n * (i % 2 === 0 ? 3 : 1), 0)
  return (10 - (sum % 10)) % 10 === check ? d : null
}

/**
 * Extract a size from free text: "250ml", "250 مل", "1L", "50 g", "15x2ml", "1.7 oz".
 * Returns { value, unit, text } with unit in ml | g | pcs | oz, or null.
 */
export function parseSize(text) {
  if (!text) return null
  const t = String(text)
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/,/g, '.')
  const units = [
    [/(\d+(?:\.\d+)?)\s*(?:x|×)\s*(\d+(?:\.\d+)?)\s*(ml|مل|ملل)\b/i, (a, b) => ({ value: +a * +b, unit: 'ml' })],
    [/(\d+(?:\.\d+)?)\s*(ml|mL|ML|مل|ملل|ملي|مليلتر)(?![a-z])/i, (a) => ({ value: +a, unit: 'ml' })],
    [/(\d+(?:\.\d+)?)\s*(l|L|ltr|litre|liter|لتر)(?![a-z])/, (a) => ({ value: +a * 1000, unit: 'ml' })],
    [/(\d+(?:\.\d+)?)\s*(g|gr|gm|grams?|جم|جرام|غرام|غ)(?![a-z])/i, (a) => ({ value: +a, unit: 'g' })],
    [/(\d+(?:\.\d+)?)\s*(kg|كجم|كيلو)(?![a-z])/i, (a) => ({ value: +a * 1000, unit: 'g' })],
    [/(\d+(?:\.\d+)?)\s*(fl\.?\s*oz|oz)(?![a-z])/i, (a) => ({ value: Math.round(+a * 29.5735), unit: 'ml' })],
    [/(\d+)\s*(pcs|pieces|pc|حبة|قطعة|قطع|pads|sheets|capsules|caps)(?![a-z])/i, (a) => ({ value: +a, unit: 'pcs' })],
  ]
  for (const [re, fn] of units) {
    const m = t.match(re)
    if (m) {
      const r = fn(m[1], m[2])
      if (r.value > 0 && r.value < 100000) return { ...r, text: m[0].trim() }
    }
  }
  return null
}

/* ---------------- JSONL writer with resume ---------------- */

export class RecordWriter {
  constructor(storeId) {
    this.storeId = storeId
    this.file = path.join(RAW_DIR, `${storeId}.jsonl`)
    fs.mkdirSync(RAW_DIR, { recursive: true })
    this.seen = new Set()
    if (fs.existsSync(this.file)) {
      for (const line of fs.readFileSync(this.file, 'utf8').split('\n')) {
        if (!line.trim()) continue
        try {
          this.seen.add(JSON.parse(line).storeProductId)
        } catch {
          /* skip corrupt line */
        }
      }
    }
    this.count = this.seen.size
    this.rejected = 0
  }

  /** Validates and appends a record; returns false if invalid or duplicate */
  write(rec) {
    const r = {
      storeId: this.storeId,
      storeName: rec.storeName,
      url: rec.url,
      storeProductId: String(rec.storeProductId ?? ''),
      name: (rec.name ?? '').replace(/\s+/g, ' ').trim(),
      nameEn: rec.nameEn?.trim() || null,
      nameAr: rec.nameAr?.trim() || null,
      brand: rec.brand?.trim() || null,
      category: rec.category?.trim() || null,
      variant: rec.variant?.trim() || null,
      size: rec.size?.trim() || null,
      barcode: normalizeBarcode(rec.barcode),
      sku: rec.sku ? String(rec.sku).trim() : null,
      price: parsePrice(rec.price),
      originalPrice: parsePrice(rec.originalPrice),
      currency: 'SAR',
      inStock: typeof rec.inStock === 'boolean' ? rec.inStock : null,
      imageUrl: rec.imageUrl || null,
      collectedAt: rec.collectedAt ?? new Date().toISOString(),
    }
    if (r.originalPrice !== null && r.price !== null && r.originalPrice <= r.price) r.originalPrice = null
    if (!r.url || !r.storeProductId || !r.name || r.price === null) {
      this.rejected++
      return false
    }
    if (this.seen.has(r.storeProductId)) return false
    this.seen.add(r.storeProductId)
    fs.appendFileSync(this.file, JSON.stringify(r) + '\n')
    this.count++
    return true
  }
}

/** Write a small run report next to the data: raw/<storeId>.report.json */
export function writeReport(storeId, report) {
  fs.writeFileSync(path.join(RAW_DIR, `${storeId}.report.json`), JSON.stringify({ storeId, finishedAt: new Date().toISOString(), ...report }, null, 2))
}
