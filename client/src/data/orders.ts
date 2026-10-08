import type { Order, OrderItem, OrderStatus, OrderTimelineStep } from '@/types'
import { STORE_CONFIG, type PaymentMethodId as PaymentMethodIdAlias } from '@/config/store'
import { products } from './products'
import { seedAddresses } from './addresses'

export const ORDER_FLOW: OrderStatus[] = ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered']

/** Build the tracking timeline for a given status and placement date */
export function buildTimeline(status: OrderStatus, createdAt: string): OrderTimelineStep[] {
  const start = new Date(createdAt).getTime()
  const reached = status === 'processing' || status === 'cancelled' ? -1 : ORDER_FLOW.indexOf(status)
  const steps: OrderTimelineStep[] = [{ status: 'placed', date: createdAt, done: true }]
  ORDER_FLOW.forEach((s, i) => {
    const done = i <= reached
    steps.push({ status: s, done, date: done ? new Date(start + (i + 1) * 9 * 3_600_000).toISOString() : undefined })
  })
  if (status === 'cancelled') steps.push({ status: 'cancelled', date: new Date(start + 5 * 3_600_000).toISOString(), done: true })
  return steps
}

function line(slug: string, quantity: number, variantLabel?: string): OrderItem {
  const p = products.find((x) => x.slug === slug) ?? products[0]
  return { productId: p.id, slug: p.slug, name: p.name, brandName: p.brandName, image: p.thumbnail, price: p.price, quantity, variantLabel }
}

function bySub(sub: string, n = 0) {
  return products.filter((p) => p.subcategory === sub)[n].slug
}

interface Seed {
  number: string
  daysAgo: number
  status: OrderStatus
  items: OrderItem[]
  method: 'standard' | 'express'
  payment: PaymentMethodIdAlias
  coupon?: string
}

const seeds: Seed[] = [
  { number: 'SX-2026-10452', daysAgo: 1, status: 'processing', items: [line(bySub('hair-care', 0), 1), line(bySub('hair-care', 3), 1)], method: 'express', payment: 'applepay' },
  { number: 'SX-2026-10398', daysAgo: 3, status: 'shipped', items: [line(bySub('lips', 0), 1, 'Dusty Rose'), line(bySub('face', 4), 1, 'Petal')], method: 'standard', payment: 'tamara' },
  { number: 'SX-2026-10312', daysAgo: 5, status: 'out_for_delivery', items: [line(bySub('mens-perfumes', 1), 1, '100 ml')], method: 'express', payment: 'mada' },
  { number: 'SX-2026-10112', daysAgo: 18, status: 'delivered', items: [line(bySub('skin-care', 3), 2), line(bySub('skin-care', 7), 1), line(bySub('skin-care', 0), 1, '30 ml')], method: 'standard', payment: 'visa', coupon: 'WELCOME10' },
  { number: 'SX-2026-10045', daysAgo: 41, status: 'delivered', items: [line(bySub('hair-devices', 0), 1)], method: 'standard', payment: 'tabby' },
  { number: 'SX-2026-10021', daysAgo: 63, status: 'cancelled', items: [line(bySub('eyes', 2), 1)], method: 'standard', payment: 'cod' },
  { number: 'SX-2026-09987', daysAgo: 90, status: 'delivered', items: [line(bySub('body-care', 0), 3), line(bySub('nails', 0), 2, 'Big Apple Red')], method: 'standard', payment: 'mada' },
]

export function priceOrder(items: OrderItem[], method: 'standard' | 'express', couponPercent = 0) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const discount = Math.round(subtotal * couponPercent) / 100
  const taxable = subtotal - discount
  const vat = Math.round(taxable * STORE_CONFIG.vatRate * 100) / 100
  const shipping =
    method === 'express'
      ? STORE_CONFIG.shipping.express.price
      : taxable >= STORE_CONFIG.freeShippingThreshold
        ? 0
        : STORE_CONFIG.shipping.standard.price
  return { subtotal, discount, vat, shipping, total: Math.round((taxable + vat + shipping) * 100) / 100 }
}

export const seedOrders: Order[] = seeds.map((s, i) => {
  const createdAt = new Date(Date.now() - s.daysAgo * 86_400_000).toISOString()
  const totals = priceOrder(s.items, s.method, s.coupon ? 10 : 0)
  return {
    id: `o-${i + 1}`,
    number: s.number,
    createdAt,
    status: s.status,
    items: s.items,
    ...totals,
    shippingMethod: s.method,
    paymentMethod: s.payment,
    address: seedAddresses[i % 3 === 2 ? 1 : 0],
    estimatedDelivery: new Date(new Date(createdAt).getTime() + (s.method === 'express' ? 2 : 4) * 86_400_000).toISOString(),
    timeline: buildTimeline(s.status, createdAt),
    couponCode: s.coupon,
  }
})
