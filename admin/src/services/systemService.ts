/**
 * Notifications, activity log, settings and global search (mock).
 */
import { all, resetAll, settingsDb, write } from '@/store/db'
import type { ActivityLog, AdminNotification, ListQuery, Paginated, StoreSettings } from '@/types'
import { delay, queryList } from '@/utils'
import { logActivity } from './_core'

/* ============================== Notifications ============================== */

export function getNotifications(q: ListQuery & { filters?: { unread?: boolean; type?: string } } = {}): Promise<Paginated<AdminNotification>> {
  const f = q.filters ?? {}
  const list = all('notifications').filter((n) => (!f.unread || !n.read) && (!f.type || n.type === f.type))
  return delay(queryList(list, { sortBy: 'date', sortDir: 'desc', pageSize: 30, ...q }, { searchFields: [(n) => n.title, (n) => n.body] }), 80)
}

export function markNotificationRead(id: string, read = true) {
  write('notifications', all('notifications').map((n) => (n.id === id ? { ...n, read } : n)))
  return delay(undefined, 40)
}

export function markAllNotificationsRead() {
  write('notifications', all('notifications').map((n) => ({ ...n, read: true })))
  return delay(undefined, 60)
}

export function deleteNotification(id: string) {
  write('notifications', all('notifications').filter((n) => n.id !== id))
  return delay(undefined, 40)
}

/* =============================== Activity log =============================== */

export function getActivity(q: ListQuery & { filters?: { userId?: string; action?: string; entity?: string; from?: string; to?: string } } = {}): Promise<Paginated<ActivityLog>> {
  const f = q.filters ?? {}
  const list = all('activity').filter(
    (a) => (!f.userId || a.userId === f.userId) && (!f.action || a.action === f.action) && (!f.entity || a.entity === f.entity) && (!f.from || a.date >= f.from) && (!f.to || a.date <= f.to + 'T23:59:59'),
  )
  return delay(queryList(list, { sortBy: 'date', sortDir: 'desc', pageSize: 25, ...q }, { searchFields: [(a) => a.description, (a) => a.userName, (a) => a.entity] }))
}

export function getRecentActivity(limit = 8): Promise<ActivityLog[]> {
  return delay([...all('activity')].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit))
}

export function getAdmins() {
  return delay(all('admins'))
}

/* ================================= Settings ================================= */

export function getSettings(): Promise<StoreSettings> {
  return delay(settingsDb.getState().settings)
}

export async function updateSettings<K extends keyof StoreSettings>(section: K, value: StoreSettings[K]): Promise<StoreSettings> {
  const next = { ...settingsDb.getState().settings, [section]: value }
  settingsDb.getState().setSettings(next)
  logActivity('updated', 'settings', `${String(section).charAt(0).toUpperCase() + String(section).slice(1)} settings were updated.`)
  return delay(next)
}

export async function resetDemoData(): Promise<void> {
  resetAll()
  return delay(undefined, 300)
}

/* ============================== Global search ============================== */

export interface SearchResults {
  products: { id: string; title: string; subtitle: string; image?: string }[]
  orders: { id: string; title: string; subtitle: string }[]
  customers: { id: string; title: string; subtitle: string }[]
  brands: { id: string; title: string; subtitle: string }[]
  categories: { id: string; title: string; subtitle: string }[]
}

export function globalSearch(query: string, limit = 5): Promise<SearchResults> {
  const q = query.trim().toLowerCase()
  const empty: SearchResults = { products: [], orders: [], customers: [], brands: [], categories: [] }
  if (q.length < 2) return delay(empty, 0)
  const brands = all('brands')
  const has = (...v: (string | undefined)[]) => v.some((x) => x?.toLowerCase().includes(q))
  return delay(
    {
      products: all('products')
        .filter((p) => has(p.name, p.sku, p.barcode, brands.find((b) => b.id === p.brandId)?.name))
        .slice(0, limit)
        .map((p) => ({ id: p.id, title: p.name, subtitle: `${brands.find((b) => b.id === p.brandId)?.name ?? ''} · ${p.sku}`, image: p.images[0] })),
      orders: all('orders')
        .filter((o) => has(o.number, o.customerName, o.trackingNumber))
        .slice(0, limit)
        .map((o) => ({ id: o.id, title: o.number, subtitle: `${o.customerName} · ${o.status.replace(/_/g, ' ')}` })),
      customers: all('customers')
        .filter((c) => has(c.name, c.email, c.phone, c.businessName))
        .slice(0, limit)
        .map((c) => ({ id: c.id, title: c.businessName ?? c.name, subtitle: `${c.email} · ${c.phone}` })),
      brands: brands
        .filter((b) => has(b.name, b.nameAr))
        .slice(0, limit)
        .map((b) => ({ id: b.id, title: b.name, subtitle: `${b.country} · ${b.authorized ? 'Authorized' : 'Not authorized'}` })),
      categories: all('categories')
        .filter((c) => has(c.name.en, c.name.ar, c.slug))
        .slice(0, limit)
        .map((c) => ({ id: c.id, title: c.name.en, subtitle: c.parentId ? `Subcategory of ${c.parentId}` : 'Top-level category' })),
    },
    120,
  )
}
