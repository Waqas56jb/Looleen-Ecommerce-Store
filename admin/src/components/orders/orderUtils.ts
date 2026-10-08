import { ORDER_FLOW } from '@/services/orderService'
import type { AdminOrder, OrderItem, OrderStatus } from '@/types'

/** Sidebar / stat-chip group keys → concrete statuses */
export const STATUS_GROUPS: Record<string, OrderStatus[]> = {
  processing: ['confirmed', 'processing', 'packed'],
  shipped: ['shipped', 'out_for_delivery'],
}

/**
 * Resolves the `status` URL value to concrete statuses.
 * A single group key ("processing", "shipped") expands to its group;
 * comma lists are taken 1:1.
 */
export function resolveStatusParam(list: string[]): OrderStatus[] {
  if (list.length === 1 && STATUS_GROUPS[list[0]]) return STATUS_GROUPS[list[0]]
  return list as OrderStatus[]
}

/** Sensible forward steps for an order (+ cancel while not yet shipped) */
export function nextStatuses(status: OrderStatus): OrderStatus[] {
  const i = ORDER_FLOW.indexOf(status)
  if (i < 0 || status === 'delivered') return []
  const forward = ORDER_FLOW.slice(i + 1)
  return canCancel(status) ? [...forward, 'cancelled'] : forward
}

export function canCancel(status: OrderStatus): boolean {
  const i = ORDER_FLOW.indexOf(status)
  return i >= 0 && i < ORDER_FLOW.indexOf('shipped')
}

export function canRefund(o: AdminOrder): boolean {
  return o.paymentStatus === 'paid' && o.status !== 'refunded' && o.status !== 'cancelled'
}

export const itemCount = (o: AdminOrder) => o.items.reduce((s, i) => s + i.quantity, 0)

const round2 = (n: number) => Math.round(n * 100) / 100

/** Line math: item discount, or the order-level (coupon) discount allocated pro-rata */
export function lineCalc(o: AdminOrder, item: OrderItem) {
  const gross = item.unitPrice * item.quantity
  const discount = item.discount > 0 ? item.discount : o.subtotal > 0 ? round2((o.discount * gross) / o.subtotal) : 0
  const net = gross - discount
  const vat = round2(net * 0.15)
  return { gross, discount, vat, total: round2(net + vat) }
}

export const phoneDigits = (phone: string) => phone.replace(/\D/g, '')
export const whatsappUrl = (phone: string) => `https://wa.me/${phoneDigits(phone)}`

export function openWhatsApp(phone: string) {
  window.open(whatsappUrl(phone), '_blank', 'noopener,noreferrer')
}

/** Estimated delivery date (ISO) by shipping method */
export function estimatedDelivery(o: AdminOrder): string {
  const days = o.shippingMethod === 'express' ? 2 : 4
  return new Date(new Date(o.createdAt).getTime() + days * 86_400_000).toISOString()
}
