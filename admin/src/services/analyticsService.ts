/**
 * Analytics API (mock). Headline series come from predefined datasets per
 * range; "live" counts (pending orders, low stock, returns) are computed from
 * the mock DB so they react to admin actions.
 */
import { CATEGORY_SHARE, CITY_SHARE, CONVERSION, KPIS, PAYMENT_SHARE, SERIES } from '@/data/seed/analytics'
import { all } from '@/store/db'
import type { DashboardStats, DateRange, SeriesPoint } from '@/types'
import { delay } from '@/utils'
import { inventoryStatus } from './_core'

export const DATE_RANGES: DateRange[] = ['today', 'yesterday', '7d', '30d', '90d', 'year', '12m']

const totalFor = (range: DateRange) => SERIES[range].reduce((s, p) => s + p.revenue, 0)

export function getDashboardStats(range: DateRange = '30d'): Promise<DashboardStats> {
  const base = KPIS[range]
  return delay({
    ...base,
    pendingOrders: all('orders').filter((o) => ['pending', 'confirmed', 'processing', 'packed'].includes(o.status)).length,
    lowStock: all('products').filter((p) => inventoryStatus(p.stock, p.lowStockThreshold) !== 'in_stock').length,
    returns: all('returns').filter((r) => !['refunded', 'rejected'].includes(r.status)).length,
  })
}

export function getRevenueData(range: DateRange = '30d'): Promise<SeriesPoint[]> {
  return delay(SERIES[range])
}

export function getCategorySales(range: DateRange = '30d') {
  const total = KPIS[range].revenue.value
  return delay(CATEGORY_SHARE.map((c) => ({ ...c, revenue: Math.round(total * c.share), percentage: Math.round(c.share * 1000) / 10 })))
}

export function getRevenueByCity(range: DateRange = '30d') {
  const total = KPIS[range].revenue.value
  return delay(Object.entries(CITY_SHARE).map(([city, share]) => ({ city, share, revenue: Math.round(total * share), orders: Math.round(KPIS[range].orders.value * share) })))
}

export function getRevenueByPayment(range: DateRange = '30d') {
  const total = KPIS[range].revenue.value
  return delay(Object.entries(PAYMENT_SHARE).map(([method, share]) => ({ method, share, revenue: Math.round(total * share), orders: Math.round(KPIS[range].orders.value * share) })))
}

export function getConversion(range: DateRange = '30d') {
  const c = CONVERSION[range]
  return delay({ ...c, rate: Math.round((c.purchases / c.sessions) * 10000) / 100, cartRate: Math.round((c.addToCart / c.sessions) * 1000) / 10, checkoutRate: Math.round((c.checkout / c.addToCart) * 1000) / 10 })
}

export interface TopProduct {
  id: string
  name: string
  brandName: string
  category: string
  image: string
  unitsSold: number
  revenue: number
  stock: number
  views: number
  addToCarts: number
  conversion: number
  trend: number
}

/** Products ranked by revenue (scaled to the range) */
export function getTopProducts(limit = 10, range: DateRange = '30d', order: 'best' | 'worst' | 'views' | 'carts' | 'conversion' = 'best'): Promise<TopProduct[]> {
  const brands = all('brands')
  const cats = all('categories')
  const scale = totalFor(range) / totalFor('12m')
  const rows: TopProduct[] = all('products')
    .filter((p) => p.status === 'active')
    .map((p, i) => {
      const units = Math.max(1, Math.round(p.unitsSold * scale))
      return {
        id: p.id,
        name: p.name,
        brandName: brands.find((b) => b.id === p.brandId)?.name ?? p.brandId,
        category: cats.find((c) => c.id === p.subcategoryId)?.name.en ?? p.subcategoryId,
        image: p.images[0],
        unitsSold: units,
        revenue: Math.round(units * p.price),
        stock: p.stock,
        views: Math.round(p.views * scale),
        addToCarts: Math.round(p.addToCarts * scale),
        conversion: Math.round((p.unitsSold / Math.max(1, p.views)) * 1000) / 10,
        trend: Math.round((((i * 37) % 41) - 12) * 10) / 10,
      }
    })
  const sorters: Record<typeof order, (a: TopProduct, b: TopProduct) => number> = {
    best: (a, b) => b.revenue - a.revenue,
    worst: (a, b) => a.revenue - b.revenue,
    views: (a, b) => b.views - a.views,
    carts: (a, b) => b.addToCarts - a.addToCarts,
    conversion: (a, b) => b.conversion - a.conversion,
  }
  return delay(rows.sort(sorters[order]).slice(0, limit))
}

/** Customer analytics derived from the mock customer base */
export async function getCustomerAnalytics(range: DateRange = '30d') {
  const customers = all('customers')
  const byCity: Record<string, number> = {}
  customers.forEach((c) => (byCity[c.city] = (byCity[c.city] ?? 0) + 1))
  const series = SERIES[range].map((p) => ({ label: p.label, newCustomers: Math.round((p.customers ?? p.orders * 0.3) * 0.62), returning: Math.round((p.customers ?? p.orders * 0.3) * 0.38) }))
  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0)
  return delay({
    series,
    newCustomers: series.reduce((s, p) => s + p.newCustomers, 0),
    returningCustomers: series.reduce((s, p) => s + p.returning, 0),
    vip: customers.filter((c) => c.customerType === 'vip').length,
    professional: customers.filter((c) => c.customerType === 'professional').length,
    averageSpend: Math.round(totalSpent / Math.max(1, customers.length)),
    lifetimeValue: Math.round((totalSpent / Math.max(1, customers.length)) * 2.4),
    byCity: Object.entries(byCity).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count),
    topCustomers: [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10),
  })
}
