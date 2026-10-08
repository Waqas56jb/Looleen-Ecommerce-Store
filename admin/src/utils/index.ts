import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { SAUDI_CITIES, PAYMENT_METHODS, STORE_CONFIG, type CityId } from '@/config/store'
import type { Lang, ListQuery, Paginated } from '@/types'

/** Joins class names and resolves Tailwind conflicts (later classes win) */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/* ---------------- Async mock helpers ---------------- */

/** Simulated network latency for mock services (150–300ms) */
export function delay<T>(value: T, ms?: number): Promise<T> {
  const [min, max] = STORE_CONFIG.mockLatency
  const wait = ms ?? min + Math.random() * (max - min)
  return new Promise((resolve) => setTimeout(() => resolve(clone(value)), wait))
}

export function clone<T>(v: T): T {
  try {
    return structuredClone(v)
  } catch {
    return v
  }
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

/* ---------------- Formatting ---------------- */

export function formatNumber(value: number, digits?: number): string {
  const hasFraction = Math.round(value * 100) % 100 !== 0
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits ?? (hasFraction ? 2 : 0),
    maximumFractionDigits: digits ?? 2,
  })
}

/** Compact numbers for KPIs: 284.6K, 1.2M */
export function formatCompact(value: number): string {
  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

/** Plain-text money for strings/CSV/toasts: "SAR 1,240" / "1,240 ريال". UI uses <Money />. */
export function formatPrice(value: number, lang: Lang = 'en'): string {
  const n = formatNumber(value)
  return lang === 'ar' ? `${n} ${STORE_CONFIG.currencyNameAr}` : `${STORE_CONFIG.currency} ${n}`
}

export function formatPercent(value: number, digits = 1): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`
}

const locale = (lang: Lang) => (lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB')

export function formatDate(iso: string | undefined, lang: Lang = 'en', opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(locale(lang), opts ?? { day: 'numeric', month: 'short', year: 'numeric', timeZone: STORE_CONFIG.timezone })
}

export function formatDateTime(iso: string | undefined, lang: Lang = 'en'): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(locale(lang), { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: STORE_CONFIG.timezone })
}

/** "5 min ago", "3 days ago" (localized) */
export function timeAgo(iso: string, lang: Lang = 'en'): string {
  const rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar' : 'en', { numeric: 'auto' })
  // Clamp tiny clock skews / future seed dates to "now"
  const diff = Math.min(0, (new Date(iso).getTime() - Date.now()) / 1000)
  const abs = Math.abs(diff)
  if (abs < 60) return rtf.format(Math.round(diff), 'second')
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day')
  if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), 'month')
  return rtf.format(Math.round(diff / (86400 * 365)), 'year')
}

export function cityName(id: CityId | string, lang: Lang = 'en'): string {
  const c = SAUDI_CITIES.find((x) => x.id === id)
  return c ? c[lang] : id
}

export function paymentName(id: string, lang: Lang = 'en'): string {
  const p = PAYMENT_METHODS.find((x) => x.id === id)
  return p ? p[lang] : id
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => !/^al-?$/i.test(w))
    .map((w) => w.replace(/^Al-/i, '')[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/* ---------------- Validation ---------------- */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

export function isValidSaudiPhone(phone: string): boolean {
  return /^(\+9665\d{8}|9665\d{8}|05\d{8})$/.test(phone.replace(/[\s-]/g, ''))
}

export function isValidUrl(url: string): boolean {
  if (url.startsWith('/') || url.startsWith('photo-')) return true
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/* ---------------- Generic list engine ---------------- */

type Getter<T> = (item: T) => unknown

/**
 * Search + sort + paginate an in-memory list — mirrors what a real list
 * endpoint would do (`GET /products?search=&sortBy=&page=`).
 */
export function queryList<T>(items: T[], q: ListQuery, opts: { searchFields: Getter<T>[]; sortFields?: Record<string, Getter<T>> }): Paginated<T> {
  let list = items
  const term = q.search?.trim().toLowerCase()
  if (term) {
    list = list.filter((it) => opts.searchFields.some((f) => String(f(it) ?? '').toLowerCase().includes(term)))
  }
  if (q.sortBy) {
    const get = opts.sortFields?.[q.sortBy] ?? ((it: T) => (it as Record<string, unknown>)[q.sortBy!])
    const dir = q.sortDir === 'asc' ? 1 : -1
    list = [...list].sort((a, b) => {
      const va = get(a)
      const vb = get(b)
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va ?? '').localeCompare(String(vb ?? ''), 'en', { numeric: true }) * dir
    })
  }
  const pageSize = q.pageSize ?? 20
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize))
  const page = Math.min(Math.max(1, q.page ?? 1), totalPages)
  return { items: list.slice((page - 1) * pageSize, page * pageSize), total: list.length, page, pageSize, totalPages }
}

/* ---------------- CSV export ---------------- */

/** Builds a CSV (UTF-8 BOM so Excel opens Arabic correctly) and downloads it */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : Array.isArray(v) ? v.join('; ') : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = '﻿' + [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Resolve an image reference (Unsplash pool id or URL) to a sized URL */
export function imageUrl(src: string | undefined, w = 400, h?: number): string {
  if (!src) return ''
  if (src.startsWith('photo-')) return `https://images.unsplash.com/${src}?auto=format&q=70&w=${w}${h ? `&h=${h}&fit=crop` : ''}`
  return src
}
