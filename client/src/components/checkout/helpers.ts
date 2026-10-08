import { PAYMENT_METHODS, type PaymentMethodId } from '@/config/store'
import type { Lang, ShippingMethod } from '@/types'
import { formatDate } from '@/utils'

/* ---------- Delivery estimates (Saudi weekend = Friday & Saturday) ---------- */

export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from)
  let added = 0
  while (added < days) {
    d.setDate(d.getDate() + 1)
    const wd = d.getDay()
    if (wd !== 5 && wd !== 6) added++
  }
  return d
}

const RANGES: Record<ShippingMethod, [number, number]> = { standard: [2, 4], express: [1, 2] }

/** "Tue 14 Oct – Thu 16 Oct" style range for a shipping method */
export function deliveryRange(method: ShippingMethod, lang: Lang, from = new Date()): string {
  const [a, b] = RANGES[method]
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }
  return `${formatDate(addBusinessDays(from, a).toISOString(), lang, opts)} – ${formatDate(addBusinessDays(from, b).toISOString(), lang, opts)}`
}

/* ---------- Payment ---------- */

export const CARD_METHODS: PaymentMethodId[] = ['mada', 'visa', 'mastercard']
export const isCardMethod = (id: PaymentMethodId | null | undefined) => !!id && CARD_METHODS.includes(id)

export function paymentLabel(id: PaymentMethodId, lang: Lang): string {
  const m = PAYMENT_METHODS.find((p) => p.id === id)
  return m ? (lang === 'ar' ? m.labelAr : m.label) : id
}

export interface CardDetails {
  number: string
  expiry: string
  cvc: string
  name: string
}

export const EMPTY_CARD: CardDetails = { number: '', expiry: '', cvc: '', name: '' }

/** "4242424242424242" → "4242 4242 4242 4242" */
export const formatCardNumber = (v: string) =>
  v
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ')

/** "1228" → "12/28" */
export function formatExpiry(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

function luhn(num: string): boolean {
  let sum = 0
  let dbl = false
  for (let i = num.length - 1; i >= 0; i--) {
    let n = Number(num[i])
    if (dbl) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    dbl = !dbl
  }
  return sum % 10 === 0
}

export type CardErrors = Partial<Record<keyof CardDetails, boolean>>

export function validateCard(c: CardDetails): CardErrors {
  const e: CardErrors = {}
  const num = c.number.replace(/\D/g, '')
  if (num.length < 13 || num.length > 19 || !luhn(num)) e.number = true
  const m = /^(\d{2})\/(\d{2})$/.exec(c.expiry)
  if (!m) e.expiry = true
  else {
    const month = Number(m[1])
    const year = 2000 + Number(m[2])
    const now = new Date()
    const endOfMonth = new Date(year, month, 0, 23, 59, 59)
    if (month < 1 || month > 12 || endOfMonth < now) e.expiry = true
  }
  if (!/^\d{3,4}$/.test(c.cvc)) e.cvc = true
  if (!c.name.trim()) e.name = true
  return e
}

export const isCardValid = (c: CardDetails) => Object.keys(validateCard(c)).length === 0
