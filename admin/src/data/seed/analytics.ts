import type { DashboardStats, DateRange, SeriesPoint } from '@/types'
import { rng } from './helpers'

/**
 * Predefined analytics datasets per date range. The dashboard/reports switch
 * between these; a real backend would compute them from orders.
 */

const r = rng(284650)

const MONTHS_EN = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
const MONTHLY_REVENUE = [196000, 238000, 182000, 204000, 219000, 231000, 248000, 261000, 272000, 284000, 312000, 284650]

function daily(days: number, base: number, end: Date): SeriesPoint[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(end.getTime() - (days - 1 - i) * 86_400_000)
    const weekend = d.getDay() === 4 || d.getDay() === 5 // Thu/Fri peaks in KSA
    const revenue = Math.round(base * (0.78 + r.next() * 0.44) * (weekend ? 1.22 : 1))
    const orders = Math.round(revenue / (205 + r.next() * 40))
    return { label: d.toISOString().slice(0, 10), revenue, orders, customers: Math.round(orders * (0.28 + r.next() * 0.12)), aov: Math.round(revenue / Math.max(1, orders)) }
  })
}

function hourly(base: number): SeriesPoint[] {
  return Array.from({ length: 24 }, (_, h) => {
    const curve = h < 8 ? 0.15 : h < 12 ? 0.6 : h < 17 ? 0.85 : h < 23 ? 1.45 : 0.7
    const revenue = Math.round((base / 24) * curve * (0.8 + r.next() * 0.4))
    const orders = Math.max(0, Math.round(revenue / 220))
    return { label: `${String(h).padStart(2, '0')}:00`, revenue, orders, aov: orders ? Math.round(revenue / orders) : 0 }
  })
}

const END = new Date('2026-10-08T12:00:00+03:00')

export const SERIES: Record<DateRange, SeriesPoint[]> = {
  today: hourly(9800),
  yesterday: hourly(9300),
  '7d': daily(7, 9400, END),
  '30d': daily(30, 9100, END),
  '90d': daily(90, 8600, END),
  '12m': MONTHLY_REVENUE.map((revenue, i) => {
    const orders = Math.round(revenue / (212 + r.next() * 18))
    return { label: MONTHS_EN[i], revenue, orders, customers: Math.round(orders * 0.34), aov: Math.round(revenue / orders) }
  }),
  year: MONTHLY_REVENUE.slice(2).map((revenue, i) => {
    const orders = Math.round(revenue / (212 + r.next() * 18))
    return { label: MONTHS_EN[i + 2], revenue, orders, customers: Math.round(orders * 0.34), aov: Math.round(revenue / orders) }
  }),
}

const kpi = (value: number, change: number) => ({ value, change, previous: Math.round(value / (1 + change / 100)) })

/** Headline KPIs per range (30d matches the brief's example values) */
export const KPIS: Record<DateRange, DashboardStats> = {
  today: { revenue: kpi(9840, 6.2), orders: kpi(46, 4.5), customers: kpi(18, 12.5), productsSold: kpi(131, 7.4), pendingOrders: 0, lowStock: 0, returns: 2, averageOrderValue: kpi(214, 1.6) },
  yesterday: { revenue: kpi(9265, -3.1), orders: kpi(44, -2.2), customers: kpi(16, 6.7), productsSold: kpi(122, -1.6), pendingOrders: 0, lowStock: 0, returns: 1, averageOrderValue: kpi(211, -0.9) },
  '7d': { revenue: kpi(68420, 9.8), orders: kpi(318, 8.2), customers: kpi(1964, 2.1), productsSold: kpi(912, 10.4), pendingOrders: 0, lowStock: 0, returns: 6, averageOrderValue: kpi(215, 1.5) },
  '30d': { revenue: kpi(284650, 18.4), orders: kpi(1284, 12.8), customers: kpi(8492, 9.3), productsSold: kpi(3842, 14.1), pendingOrders: 0, lowStock: 0, returns: 18, averageOrderValue: kpi(222, 5.0) },
  '90d': { revenue: kpi(818900, 15.2), orders: kpi(3722, 11.6), customers: kpi(8492, 21.4), productsSold: kpi(11240, 13.3), pendingOrders: 0, lowStock: 0, returns: 49, averageOrderValue: kpi(220, 3.2) },
  '12m': { revenue: kpi(2931650, 34.6), orders: kpi(13410, 29.8), customers: kpi(8492, 41.2), productsSold: kpi(40220, 31.5), pendingOrders: 0, lowStock: 0, returns: 188, averageOrderValue: kpi(219, 3.7) },
  year: { revenue: kpi(2497650, 31.9), orders: kpi(11460, 27.4), customers: kpi(8492, 38.0), productsSold: kpi(34380, 29.1), pendingOrders: 0, lowStock: 0, returns: 161, averageOrderValue: kpi(218, 3.5) },
}

/** Share of revenue by top-level storefront category (sums to 1) */
export const CATEGORY_SHARE: { id: string; en: string; ar: string; share: number }[] = [
  { id: 'skin-care', en: 'Skin Care', ar: 'العناية بالبشرة', share: 0.29 },
  { id: 'hair-care', en: 'Hair Care', ar: 'العناية بالشعر', share: 0.17 },
  { id: 'makeup', en: 'Makeup', ar: 'المكياج', share: 0.21 },
  { id: 'perfumes', en: 'Perfumes', ar: 'العطور', share: 0.19 },
  { id: 'beauty-devices', en: 'Beauty Devices', ar: 'أجهزة التجميل', share: 0.08 },
  { id: 'salon-supplies', en: 'Salon Supplies', ar: 'مستلزمات الصالونات', share: 0.06 },
]

export const CITY_SHARE: Record<string, number> = { riyadh: 0.38, jeddah: 0.21, dammam: 0.1, khobar: 0.08, mecca: 0.07, medina: 0.05, abha: 0.03, tabuk: 0.03, taif: 0.03, jubail: 0.02 }

export const PAYMENT_SHARE: Record<string, number> = { mada: 0.31, applepay: 0.22, visa: 0.1, mastercard: 0.06, stcpay: 0.05, tabby: 0.12, tamara: 0.07, cod: 0.07 }

/** Funnel-style mock metrics */
export const CONVERSION: Record<DateRange, { sessions: number; addToCart: number; checkout: number; purchases: number }> = {
  today: { sessions: 3820, addToCart: 412, checkout: 118, purchases: 46 },
  yesterday: { sessions: 3610, addToCart: 398, checkout: 109, purchases: 44 },
  '7d': { sessions: 25840, addToCart: 2890, checkout: 812, purchases: 318 },
  '30d': { sessions: 102300, addToCart: 11840, checkout: 3310, purchases: 1284 },
  '90d': { sessions: 296500, addToCart: 34100, checkout: 9540, purchases: 3722 },
  '12m': { sessions: 1068000, addToCart: 121200, checkout: 34800, purchases: 13410 },
  year: { sessions: 912000, addToCart: 103900, checkout: 29700, purchases: 11460 },
}
