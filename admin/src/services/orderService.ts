/**
 * Orders API (mock). Every status change writes an activity log entry and a
 * notification, mirroring what the backend will do.
 */
import type { PaymentMethodId } from '@/config/store'
import { all, write } from '@/store/db'
import { currentAdminName } from '@/store/authStore'
import type { AdminOrder, ListQuery, OrderStatus, Paginated, ShippingMethod } from '@/types'
import { delay, formatPrice, nowIso, queryList, uid } from '@/utils'
import { inList, logActivity, NotFoundError, pushNotification } from './_core'

export const ORDER_FLOW: OrderStatus[] = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered']
export const ALL_ORDER_STATUSES: OrderStatus[] = [...ORDER_FLOW, 'cancelled', 'refunded']

export interface OrderFilters {
  status?: OrderStatus | OrderStatus[]
  paymentMethod?: PaymentMethodId | PaymentMethodId[]
  shippingMethod?: ShippingMethod
  customerId?: string
  from?: string
  to?: string
  minTotal?: number
  maxTotal?: number
}

function filterOrders(list: AdminOrder[], f: OrderFilters = {}) {
  return list.filter(
    (o) =>
      inList(o.status, f.status) &&
      inList(o.paymentMethod, f.paymentMethod) &&
      (!f.shippingMethod || o.shippingMethod === f.shippingMethod) &&
      (!f.customerId || o.customerId === f.customerId) &&
      (!f.from || o.createdAt >= f.from) &&
      (!f.to || o.createdAt <= f.to + 'T23:59:59') &&
      (f.minTotal === undefined || o.total >= f.minTotal) &&
      (f.maxTotal === undefined || o.total <= f.maxTotal),
  )
}

export function getOrders(q: ListQuery & { filters?: OrderFilters } = {}): Promise<Paginated<AdminOrder>> {
  return delay(
    queryList(filterOrders(all('orders'), q.filters as OrderFilters), { sortBy: 'createdAt', sortDir: 'desc', ...q }, {
      searchFields: [(o) => o.number, (o) => o.customerName, (o) => o.customerEmail, (o) => o.customerPhone, (o) => o.trackingNumber],
      sortFields: { items: (o) => o.items.reduce((s, i) => s + i.quantity, 0) },
    }),
  )
}

export function getAllOrders(): Promise<AdminOrder[]> {
  return delay(all('orders'))
}

export async function getOrderStats() {
  const list = all('orders')
  const by = (s: OrderStatus | OrderStatus[]) => list.filter((o) => inList(o.status, s)).length
  return delay({
    total: list.length,
    pending: by('pending'),
    processing: by(['confirmed', 'processing', 'packed']),
    shipped: by(['shipped', 'out_for_delivery']),
    delivered: by('delivered'),
    cancelled: by('cancelled'),
    refunded: by('refunded'),
    revenue: list.filter((o) => !['cancelled', 'refunded'].includes(o.status)).reduce((s, o) => s + o.total, 0),
  })
}

export function getOrder(id: string): Promise<AdminOrder | undefined> {
  return delay(all('orders').find((o) => o.id === id || o.number === id))
}

export function getRecentOrders(limit = 8): Promise<AdminOrder[]> {
  return delay([...all('orders')].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit))
}

const STATUS_WORD: Record<string, string> = {
  pending: 'pending',
  confirmed: 'confirmed',
  processing: 'processing',
  packed: 'packed',
  shipped: 'shipped',
  out_for_delivery: 'out for delivery',
  delivered: 'delivered',
  cancelled: 'cancelled',
  refunded: 'refunded',
}

function patchOrder(id: string, fn: (o: AdminOrder) => AdminOrder): AdminOrder {
  const list = all('orders')
  const o = list.find((x) => x.id === id)
  if (!o) throw new NotFoundError('Order', id)
  const updated = fn(o)
  write('orders', list.map((x) => (x.id === id ? updated : x)))
  return updated
}

export async function updateOrderStatus(id: string, status: OrderStatus, note?: string, tracking?: { number?: string; carrier?: string }): Promise<AdminOrder> {
  const by = currentAdminName()
  const before = all('orders').find((o) => o.id === id)
  const updated = patchOrder(id, (o) => ({
    ...o,
    status,
    paymentStatus: status === 'delivered' && o.paymentMethod === 'cod' ? 'paid' : status === 'refunded' ? 'refunded' : o.paymentStatus,
    trackingNumber: tracking?.number || (status === 'shipped' && !o.trackingNumber ? String(Math.floor(1e8 + Math.random() * 9e8)) : o.trackingNumber),
    carrier: tracking?.carrier || (status === 'shipped' && !o.carrier ? 'SMSA Express' : o.carrier),
    timeline: [...o.timeline, { id: uid('ev'), status, date: nowIso(), by, note }],
    updatedAt: nowIso(),
  }))
  logActivity('status_changed', 'order', `Order ${updated.number} moved from ${STATUS_WORD[before?.status ?? ''] ?? '—'} to ${STATUS_WORD[status]}.`, id)
  pushNotification('order_update', `Order ${updated.number} updated`, `Order ${updated.number} has been marked as ${STATUS_WORD[status]}.`, `/orders/${id}`)
  return delay(updated)
}

export async function bulkUpdateOrderStatus(ids: string[], status: OrderStatus): Promise<number> {
  for (const id of ids) await updateOrderStatus(id, status)
  return ids.length
}

export async function cancelOrder(id: string, reason: string): Promise<AdminOrder> {
  const o = await updateOrderStatus(id, 'cancelled', reason)
  if (o.paymentStatus === 'paid') patchOrder(id, (x) => ({ ...x, paymentStatus: 'refunded' }))
  return delay(all('orders').find((x) => x.id === id)!)
}

/** Full or partial refund (mock). Full refunds move the order to "refunded". */
export async function refundOrder(id: string, amount: number, reason: string): Promise<AdminOrder> {
  const o = all('orders').find((x) => x.id === id)
  if (!o) throw new NotFoundError('Order', id)
  const full = amount >= o.total - 0.01
  if (full) await updateOrderStatus(id, 'refunded', reason)
  const updated = patchOrder(id, (x) => ({
    ...x,
    paymentStatus: full ? 'refunded' : x.paymentStatus,
    notes: [...x.notes, { id: uid('n'), text: `Refund of ${formatPrice(amount)} issued — ${reason}`, by: currentAdminName(), date: nowIso() }],
  }))
  logActivity('refunded', 'order', `Refund of ${formatPrice(amount)} issued for order ${o.number}.`, id)
  return delay(updated)
}

export async function addOrderNote(id: string, text: string): Promise<AdminOrder> {
  const updated = patchOrder(id, (o) => ({ ...o, notes: [...o.notes, { id: uid('n'), text, by: currentAdminName(), date: nowIso() }], updatedAt: nowIso() }))
  logActivity('updated', 'order', `Note added to order ${updated.number}.`, id)
  return delay(updated)
}

export function getOrdersByCustomer(customerId: string): Promise<AdminOrder[]> {
  return delay(all('orders').filter((o) => o.customerId === customerId))
}
