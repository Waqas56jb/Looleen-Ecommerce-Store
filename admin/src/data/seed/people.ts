import { SAUDI_CITIES, STORE_CONFIG, type CityId, type PaymentMethodId } from '@/config/store'
import type { AdminCustomer, AdminOrder, AdminUser, Address, OrderEvent, OrderItem, OrderStatus, PaymentStatus, SalonType, ShippingMethod, SupportTicket } from '@/types'
import { seedBrands, seedProducts } from './catalog'
import { DAY, DISTRICTS, FIRST_NAMES_F, FIRST_NAMES_M, LAST_NAMES, SEED_NOW, STREETS, daysAgo, rng, round2, saudiPhone } from './helpers'

const r = rng(966)

/* ---------------- Admin team ---------------- */

export const seedAdmins: AdminUser[] = [
  { id: 'adm-1', name: 'Mohammed B Amr', email: 'admin@beautystore.sa', phone: '+966 55 010 2030', role: 'super_admin', status: 'active', lastLoginAt: daysAgo(0, 1) },
  { id: 'adm-2', name: 'Faisal Al-Otaibi', email: 'faisal@beautystore.sa', phone: '+966 54 220 1180', role: 'store_manager', status: 'active', lastLoginAt: daysAgo(0, 3) },
  { id: 'adm-3', name: 'Hessa Al-Ghamdi', email: 'hessa@beautystore.sa', phone: '+966 56 330 4411', role: 'product_manager', status: 'active', lastLoginAt: daysAgo(1) },
  { id: 'adm-4', name: 'Omar Al-Zahrani', email: 'omar@beautystore.sa', phone: '+966 50 440 9921', role: 'order_manager', status: 'active', lastLoginAt: daysAgo(0, 5) },
  { id: 'adm-5', name: 'Lama Al-Shehri', email: 'lama@beautystore.sa', phone: '+966 53 118 7702', role: 'customer_support', status: 'active', lastLoginAt: daysAgo(0, 2) },
  { id: 'adm-6', name: 'Rawan Al-Malki', email: 'rawan@beautystore.sa', phone: '+966 55 902 3317', role: 'content_manager', status: 'active', lastLoginAt: daysAgo(2) },
  { id: 'adm-7', name: 'Sultan Al-Anazi', email: 'sultan@beautystore.sa', phone: '+966 58 771 0045', role: 'inventory_manager', status: 'invited' },
]

/* ---------------- Customers ---------------- */

const SALONS: { name: string; type: SalonType }[] = [
  { name: 'Velvet Hair Lounge', type: 'hair_salon' },
  { name: 'Lustre Nail Studio', type: 'nail_salon' },
  { name: 'Derma Glow Clinic', type: 'beauty_clinic' },
  { name: 'Rose Oud Spa', type: 'spa' },
  { name: 'Contour Makeup Studio', type: 'makeup_studio' },
  { name: 'The Gentlemen Barbershop', type: 'barbershop' },
  { name: 'Silk & Shine Salon', type: 'hair_salon' },
  { name: 'Polish Bar Riyadh', type: 'nail_salon' },
  { name: 'Al Yasmin Beauty Center', type: 'beauty_clinic' },
  { name: 'Lavender Day Spa', type: 'spa' },
  { name: 'Glam Room Jeddah', type: 'makeup_studio' },
  { name: 'Fade & Line Barbers', type: 'barbershop' },
]

function makeAddress(name: string, phone: string, city: CityId): Address {
  return {
    fullName: name,
    phone,
    city,
    district: r.pick(DISTRICTS[city]),
    street: r.pick(STREETS),
    building: String(r.int(1000, 9999)),
    apartment: r.chance(0.5) ? String(r.int(1, 40)) : undefined,
    postalCode: String(r.int(11000, 34999)),
  }
}

const cityWeights: CityId[] = ['riyadh', 'riyadh', 'riyadh', 'riyadh', 'jeddah', 'jeddah', 'jeddah', 'dammam', 'dammam', 'khobar', 'khobar', 'mecca', 'medina', 'abha', 'tabuk', 'taif', 'jubail']

export const seedCustomers: AdminCustomer[] = Array.from({ length: 64 }, (_, i) => {
  const female = i % 6 !== 5
  const first = female ? FIRST_NAMES_F[i % FIRST_NAMES_F.length] : FIRST_NAMES_M[i % FIRST_NAMES_M.length]
  const last = LAST_NAMES[(i * 7) % LAST_NAMES.length]
  const name = i === 0 ? 'Noura Al-Qahtani' : i === 5 ? 'Ahmed Ali' : `${first} ${last}`
  const city = i === 0 ? 'riyadh' : r.pick(cityWeights)
  const phone = i === 0 ? '+966 55 123 4567' : saudiPhone(r)
  const salon = i >= 50 ? SALONS[i - 50] : undefined
  const type = salon ? 'professional' : i % 9 === 3 ? 'vip' : 'regular'
  return {
    id: `cus-${1001 + i}`,
    name: salon ? `${first} ${last}` : name,
    email: `${(salon ? salon.name : name).toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@${salon ? 'salon.sa' : r.pick(['gmail.com', 'outlook.sa', 'icloud.com', 'hotmail.com'])}`,
    phone,
    city,
    gender: female ? 'female' : 'male',
    customerType: type,
    businessName: salon?.name,
    businessType: salon?.type,
    contactPerson: salon ? `${first} ${last}` : undefined,
    status: i % 13 === 12 ? 'inactive' : 'active',
    loyaltyPoints: r.int(0, 3800),
    ordersCount: 0,
    totalSpent: 0,
    registeredAt: daysAgo(i < 8 ? r.int(1, 25) : r.int(30, 600)),
    addresses: [makeAddress(salon ? salon.name : name, phone, city)],
    wishlist: r.shuffle(seedProducts).slice(0, r.int(0, 6)).map((p) => p.id),
    tags: salon ? ['salon', 'bulk'] : type === 'vip' ? ['vip'] : [],
  } satisfies AdminCustomer
})

/* ---------------- Orders ---------------- */

const STATUS_PLAN: OrderStatus[] = [
  'pending', 'pending', 'pending', 'confirmed', 'confirmed', 'processing', 'processing', 'processing', 'packed', 'packed',
  'shipped', 'shipped', 'shipped', 'out_for_delivery', 'out_for_delivery',
  'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered',
  'cancelled', 'cancelled', 'refunded',
]
const FLOW: OrderStatus[] = ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered']
const PAYMENTS: PaymentMethodId[] = ['mada', 'mada', 'mada', 'applepay', 'applepay', 'visa', 'mastercard', 'stcpay', 'tabby', 'tabby', 'tamara', 'cod', 'cod']
const STAFF = ['Omar Al-Zahrani', 'Faisal Al-Otaibi', 'System']

function buildTimeline(status: OrderStatus, createdAt: string): OrderEvent[] {
  const t0 = new Date(createdAt).getTime()
  const ev: OrderEvent[] = [{ id: 'e0', status: 'placed', date: createdAt, by: 'Customer' }]
  if (status === 'pending') return ev
  if (status === 'cancelled') return [...ev, { id: 'e1', status: 'cancelled', date: new Date(t0 + 3 * 3_600_000).toISOString(), by: STAFF[0], note: 'Cancelled at customer request' }]
  const reachIdx = status === 'refunded' ? FLOW.length - 1 : FLOW.indexOf(status)
  FLOW.slice(0, reachIdx + 1).forEach((s, i) => ev.push({ id: `e${i + 1}`, status: s, date: new Date(t0 + (i + 1) * 7 * 3_600_000).toISOString(), by: i === 0 ? 'System' : STAFF[i % 2] }))
  if (status === 'refunded') ev.push({ id: 'er', status: 'refunded', date: new Date(t0 + 6 * DAY).toISOString(), by: STAFF[1], note: 'Refunded after approved return' })
  return ev
}

const active = seedProducts.filter((p) => p.status === 'active')

export const seedOrders: AdminOrder[] = Array.from({ length: 48 }, (_, i) => {
  const customer = i === 0 ? seedCustomers[0] : i === 1 ? seedCustomers[5] : seedCustomers[r.int(0, seedCustomers.length - 1)]
  const isPro = customer.customerType === 'professional'
  const status = i === 0 ? 'processing' : STATUS_PLAN[i % STATUS_PLAN.length]
  // Recent orders are the early statuses; delivered ones are older
  const age = status === 'pending' ? r.next() * 0.6 : FLOW.indexOf(status) >= 0 && FLOW.indexOf(status) < 3 ? 0.4 + r.next() * 2 : status === 'shipped' || status === 'out_for_delivery' ? 1.5 + r.next() * 3 : 4 + r.next() * 85
  const createdAt = new Date(SEED_NOW - age * DAY).toISOString()
  const lines = r.int(1, isPro ? 5 : 3)
  const items: OrderItem[] = r.shuffle(isPro ? active.filter((p) => p.flags.professional || r.chance(0.3)) : active).slice(0, lines).map((p) => {
    const v = p.variants[0]
    return { productId: p.id, name: p.name, brandName: p.brandId, sku: v?.sku ?? p.sku, image: p.images[0], variant: v?.name, quantity: isPro ? r.int(2, 12) : r.int(1, 2), unitPrice: v?.price ?? p.price, discount: 0 }
  })
  const subtotal = round2(items.reduce((s, it) => s + it.unitPrice * it.quantity, 0))
  const couponCode = isPro && subtotal >= 500 ? 'SALON20' : r.chance(0.18) ? 'WELCOME10' : undefined
  const discount = couponCode ? round2(subtotal * (couponCode === 'SALON20' ? 0.2 : 0.1)) : 0
  const shippingMethod: ShippingMethod = r.chance(0.28) ? 'express' : 'standard'
  const taxable = subtotal - discount
  const shipping = shippingMethod === 'express' ? STORE_CONFIG.shipping.express.price : taxable >= STORE_CONFIG.freeShippingThreshold ? 0 : STORE_CONFIG.shipping.standard.price
  const vat = round2(taxable * STORE_CONFIG.vatRate)
  const paymentMethod = i === 0 ? 'applepay' : r.pick(PAYMENTS)
  const paymentStatus: PaymentStatus = status === 'refunded' ? 'refunded' : status === 'cancelled' ? (paymentMethod === 'cod' ? 'pending' : 'refunded') : paymentMethod === 'cod' ? (status === 'delivered' ? 'paid' : 'pending') : i % 23 === 7 ? 'failed' : 'paid'
  const number = i === 0 ? 'SX-2026-10452' : `SX-2026-${String(10451 - i * 7)}`
  const timeline = buildTimeline(status, createdAt)
  return {
    id: `ord-${number.slice(-5)}`,
    number,
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    items,
    subtotal,
    discount,
    couponCode,
    vat,
    shipping,
    total: round2(taxable + vat + shipping),
    paymentMethod,
    paymentStatus,
    shippingMethod,
    carrier: ['shipped', 'out_for_delivery', 'delivered', 'refunded'].includes(status) ? r.pick(['SMSA Express', 'Aramex', 'SPL']) : undefined,
    trackingNumber: ['shipped', 'out_for_delivery', 'delivered', 'refunded'].includes(status) ? `${r.int(100000000, 999999999)}` : undefined,
    status,
    address: customer.addresses[0],
    notes: i % 6 === 0 ? [{ id: 'n1', text: 'Customer asked for gift wrapping.', by: 'Lama Al-Shehri', date: createdAt }] : [],
    timeline,
    createdAt,
    updatedAt: timeline[timeline.length - 1].date,
  }
}).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

// Brand display names on items (stored as ids above for brevity)
seedOrders.forEach((o) => o.items.forEach((it) => (it.brandName = seedBrands.find((b) => b.id === it.brandName)?.name ?? it.brandName)))

// Roll order stats into customers
seedCustomers.forEach((c) => {
  const mine = seedOrders.filter((o) => o.customerId === c.id && o.status !== 'cancelled')
  const lifetime = c.customerType === 'professional' ? r.int(4, 18) : c.customerType === 'vip' ? r.int(9, 24) : r.int(0, 6)
  c.ordersCount = mine.length + lifetime
  c.totalSpent = round2(mine.reduce((s, o) => s + o.total, 0) + lifetime * (c.customerType === 'professional' ? r.int(600, 1800) : c.customerType === 'vip' ? r.int(450, 900) : r.int(150, 420)))
  const last = seedOrders.find((o) => o.customerId === c.id)
  c.lastOrderAt = last?.createdAt ?? (c.ordersCount ? daysAgo(r.int(20, 200)) : undefined)
})

export const seedTickets: SupportTicket[] = [
  { id: 'tk-1', customerId: 'cus-1001', subject: 'Batch code verification for Chanel N°5', status: 'answered', createdAt: daysAgo(20) },
  { id: 'tk-2', customerId: 'cus-1051', subject: 'Professional pricing for bulk Wella colour', status: 'open', createdAt: daysAgo(2) },
  { id: 'tk-3', customerId: 'cus-1006', subject: 'Delivery time to Jeddah', status: 'closed', createdAt: daysAgo(35) },
  { id: 'tk-4', customerId: 'cus-1013', subject: 'Exchange shade for Fenty foundation', status: 'open', createdAt: daysAgo(1) },
]

export const CITY_NAME = (id: CityId) => SAUDI_CITIES.find((c) => c.id === id)!
