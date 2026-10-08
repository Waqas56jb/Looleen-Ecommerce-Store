import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { STORE_CONFIG } from '@/config/store'
import type { Lang } from '@/types'

/** Joins class names and resolves Tailwind conflicts (later classes win) */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/* ---------------- Storage (namespaced, SSR/blocked-storage safe) ---------------- */

export const storage = {
  key: (k: string) => `${STORE_CONFIG.storagePrefix}${k}`,
  get<T>(k: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(storage.key(k))
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  },
  set(k: string, value: unknown): void {
    try {
      localStorage.setItem(storage.key(k), JSON.stringify(value))
    } catch {
      /* storage unavailable — ignore */
    }
  },
  remove(k: string): void {
    try {
      localStorage.removeItem(storage.key(k))
    } catch {
      /* ignore */
    }
  },
}

/* ---------------- Formatting ---------------- */

/** "1,240" / "1,240.50" — Western digits in both languages for clarity */
export function formatNumber(value: number): string {
  const hasFraction = Math.round(value * 100) % 100 !== 0
  return value.toLocaleString('en-US', { minimumFractionDigits: hasFraction ? 2 : 0, maximumFractionDigits: 2 })
}

/**
 * Plain-text price for strings (toasts, messages, aria labels): "SAR 1,240" / "1,240 ريال".
 * In the UI prefer <Money value={…} /> which renders the official Riyal sign.
 */
export function formatPrice(value: number, lang: Lang = 'en'): string {
  const n = formatNumber(value)
  return lang === 'ar' ? `${n} ${STORE_CONFIG.currencyNameAr}` : `${STORE_CONFIG.currency} ${n}`
}

export function formatDate(iso: string, lang: Lang = 'en', opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', opts ?? { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso: string, lang: Lang = 'en'): string {
  return new Date(iso).toLocaleString(lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Simulated network latency for mock services */
export function delay<T>(value: T, ms = 150 + Math.random() * 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredCloneSafe(value)), ms))
}

function structuredCloneSafe<T>(v: T): T {
  try {
    return structuredClone(v)
  } catch {
    return v
  }
}

/** Saudi mobile: +966 5X XXX XXXX (spaces optional) or 05XXXXXXXX */
export function isValidSaudiPhone(phone: string): boolean {
  const digits = phone.replace(/[\s-]/g, '')
  return /^(\+9665\d{8}|9665\d{8}|05\d{8})$/.test(digits)
}

export function normalizeSaudiPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  const local = d.startsWith('966') ? d.slice(3) : d.startsWith('0') ? d.slice(1) : d
  if (local.length !== 9) return phone
  return `+966 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${STORE_CONFIG.whatsappNumber}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}
