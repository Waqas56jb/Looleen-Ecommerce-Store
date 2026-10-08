/**
 * Orders, coupons and checkout (mock API).
 */
import { STORE_CONFIG, type PaymentMethodId } from '@/config/store'
import { coupons } from '@/data/offers'
import { buildTimeline } from '@/data/orders'
import { useAccountStore } from '@/store/account'
import { computeTotals } from '@/store/cart'
import type { Address, AppliedCoupon, CartItem, Order, ShippingMethod } from '@/types'
import { delay, uid } from '@/utils'

export function getOrders(): Promise<Order[]> {
  return delay(useAccountStore.getState().orders)
}

export function getOrderById(idOrNumber: string): Promise<Order | undefined> {
  return delay(useAccountStore.getState().orders.find((o) => o.id === idOrNumber || o.number === idOrNumber))
}

export type CouponResult =
  | { ok: true; coupon: AppliedCoupon }
  | { ok: false; reason: 'invalid' | 'min_subtotal'; minSubtotal?: number }

export async function validateCoupon(code: string, subtotal: number): Promise<CouponResult> {
  const c = coupons.find((x) => x.code === code.trim().toUpperCase())
  await delay(null, 300)
  if (!c) return { ok: false, reason: 'invalid' }
  if (c.minSubtotal && subtotal < c.minSubtotal) return { ok: false, reason: 'min_subtotal', minSubtotal: c.minSubtotal }
  return { ok: true, coupon: { code: c.code, type: c.type, value: c.value, minSubtotal: c.minSubtotal } }
}

function nextOrderNumber(): string {
  const n = 10_453 + Math.floor(Math.random() * 500)
  return `SX-${new Date().getFullYear()}-${n}`
}

export interface PlaceOrderInput {
  items: CartItem[]
  coupon: AppliedCoupon | null
  address: Omit<Address, 'id' | 'isDefault' | 'label'>
  shippingMethod: ShippingMethod
  paymentMethod: PaymentMethodId
}

/** Creates the order, persists it to the customer’s order history and returns it */
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  await delay(null, 900)
  const totals = computeTotals(input.items, input.coupon, input.shippingMethod)
  const createdAt = new Date().toISOString()
  const days = input.shippingMethod === 'express' ? 2 : 4
  const order: Order = {
    id: uid('o'),
    number: nextOrderNumber(),
    createdAt,
    status: 'processing',
    items: input.items.map((i) => ({
      productId: i.productId,
      slug: i.slug,
      name: i.name,
      brandName: i.brandName,
      image: i.image,
      price: i.price,
      quantity: i.quantity,
      variantLabel: i.variantLabel,
    })),
    subtotal: totals.subtotal,
    discount: totals.discount,
    vat: totals.vat,
    shipping: totals.shipping,
    total: totals.total,
    shippingMethod: input.shippingMethod,
    paymentMethod: input.paymentMethod,
    address: { ...input.address, id: uid('addr'), label: 'Delivery', isDefault: false },
    estimatedDelivery: new Date(Date.now() + days * 86_400_000).toISOString(),
    timeline: buildTimeline('processing', createdAt),
    couponCode: input.coupon?.code,
  }
  useAccountStore.getState().addOrder(order)
  return order
}

export const SHIPPING_OPTIONS: { id: ShippingMethod; price: number; days: string }[] = [
  { id: 'standard', price: STORE_CONFIG.shipping.standard.price, days: STORE_CONFIG.shipping.standard.days },
  { id: 'express', price: STORE_CONFIG.shipping.express.price, days: STORE_CONFIG.shipping.express.days },
]
