/**
 * Customers API (mock), including segments and professional (salon) accounts.
 */
import { all, write } from '@/store/db'
import type { AdminCustomer, CustomerType, ListQuery, Paginated, SalonType } from '@/types'
import { delay, queryList } from '@/utils'
import { logActivity, NotFoundError } from './_core'

export type CustomerSegmentKey = 'all' | 'new' | 'vip' | 'high_spenders' | 'inactive' | 'professional' | 'salon'

const DAY = 86_400_000

export function inSegment(c: AdminCustomer, seg: CustomerSegmentKey, now = Date.now()): boolean {
  switch (seg) {
    case 'new':
      return now - new Date(c.registeredAt).getTime() < 30 * DAY
    case 'vip':
      return c.customerType === 'vip'
    case 'high_spenders':
      return c.totalSpent >= 5000
    case 'inactive':
      return c.status === 'inactive' || !c.lastOrderAt || now - new Date(c.lastOrderAt).getTime() > 120 * DAY
    case 'professional':
      return c.customerType === 'professional'
    case 'salon':
      return c.customerType === 'professional' && ['hair_salon', 'nail_salon', 'spa', 'barbershop'].includes(c.businessType ?? '')
    default:
      return true
  }
}

export interface CustomerFilters {
  segment?: CustomerSegmentKey
  customerType?: CustomerType
  city?: string | string[]
  status?: 'active' | 'inactive'
  businessType?: SalonType
}

export function getCustomers(q: ListQuery & { filters?: CustomerFilters } = {}): Promise<Paginated<AdminCustomer>> {
  const f = (q.filters ?? {}) as CustomerFilters
  const list = all('customers').filter(
    (c) =>
      inSegment(c, f.segment ?? 'all') &&
      (!f.customerType || c.customerType === f.customerType) &&
      (!f.status || c.status === f.status) &&
      (!f.businessType || c.businessType === f.businessType) &&
      (!f.city || (Array.isArray(f.city) ? !f.city.length || f.city.includes(c.city) : c.city === f.city)),
  )
  return delay(
    queryList(list, { sortBy: 'registeredAt', sortDir: 'desc', ...q }, {
      searchFields: [(c) => c.name, (c) => c.email, (c) => c.phone, (c) => c.businessName, (c) => c.id],
    }),
  )
}

export function getAllCustomers(): Promise<AdminCustomer[]> {
  return delay(all('customers'))
}

export async function getCustomerStats() {
  const list = all('customers')
  const segCount = (s: CustomerSegmentKey) => list.filter((c) => inSegment(c, s)).length
  return delay({
    total: list.length,
    newThisMonth: segCount('new'),
    active: list.filter((c) => c.status === 'active').length,
    vip: segCount('vip'),
    professional: segCount('professional'),
    highSpenders: segCount('high_spenders'),
    inactive: segCount('inactive'),
    salon: segCount('salon'),
    averageSpend: Math.round(list.reduce((s, c) => s + c.totalSpent, 0) / Math.max(1, list.length)),
  })
}

export function getCustomer(id: string): Promise<AdminCustomer | undefined> {
  return delay(all('customers').find((c) => c.id === id))
}

export async function updateCustomer(id: string, patch: Partial<AdminCustomer>): Promise<AdminCustomer> {
  const list = all('customers')
  const c = list.find((x) => x.id === id)
  if (!c) throw new NotFoundError('Customer', id)
  const updated = { ...c, ...patch, id }
  write('customers', list.map((x) => (x.id === id ? updated : x)))
  logActivity(patch.status && patch.status !== c.status ? 'status_changed' : 'updated', 'customer', `Customer ${updated.name} was ${patch.status === 'inactive' ? 'deactivated' : patch.status === 'active' && c.status === 'inactive' ? 'reactivated' : 'updated'}.`, id)
  return delay(updated)
}

export function getTickets(customerId?: string) {
  return delay(all('tickets').filter((t) => !customerId || t.customerId === customerId))
}

export async function getProfessionalStats() {
  const pros = all('customers').filter((c) => c.customerType === 'professional')
  const byType: Record<string, number> = {}
  pros.forEach((c) => (byType[c.businessType ?? 'other'] = (byType[c.businessType ?? 'other'] ?? 0) + 1))
  return delay({
    count: pros.length,
    active: pros.filter((c) => c.status === 'active').length,
    revenue: pros.reduce((s, c) => s + c.totalSpent, 0),
    orders: pros.reduce((s, c) => s + c.ordersCount, 0),
    averageOrder: Math.round(pros.reduce((s, c) => s + c.totalSpent, 0) / Math.max(1, pros.reduce((s, c) => s + c.ordersCount, 0))),
    byType,
  })
}
