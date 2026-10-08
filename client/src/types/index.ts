import type { CityId, PaymentMethodId } from '@/config/store'

export type Lang = 'en' | 'ar'

/** Text that exists in both languages. Use `useLocalized()` to read it. */
export interface LocalizedText {
  en: string
  ar: string
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'
export type Gender = 'women' | 'men' | 'unisex' | 'kids'

export type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal'
export type HairType = 'dry' | 'damaged' | 'frizzy' | 'colored' | 'curly' | 'hair-loss' | 'all'
export type Concern =
  | 'acne'
  | 'hydration'
  | 'anti-aging'
  | 'dark-spots'
  | 'sun-protection'
  | 'dryness'
  | 'sensitivity'
  | 'hair-loss'
  | 'frizz'
  | 'damage'
  | 'long-wear'
  | 'volume'

export interface Shade {
  id: string
  name: string
  hex: string
}

export interface SizeOption {
  id: string
  label: string
  /** Price for this size; falls back to product price when omitted */
  price?: number
  compareAtPrice?: number
}

export interface Product {
  id: string
  slug: string
  name: string
  brandId: string
  brandName: string
  /** Top-level category slug, e.g. `care` */
  category: string
  /** Subcategory slug, e.g. `skin-care` */
  subcategory: string
  description: LocalizedText
  shortDescription: LocalizedText
  price: number
  compareAtPrice?: number
  discountPercentage: number
  currency: 'SAR'
  rating: number
  reviewCount: number
  images: string[]
  thumbnail: string
  shades: Shade[]
  sizes: SizeOption[]
  stock: number
  stockStatus: StockStatus
  isOriginal: boolean
  isAuthorized: boolean
  isFeatured: boolean
  isBestSeller: boolean
  isTrending: boolean
  isNewArrival: boolean
  isOnSale: boolean
  tags: string[]
  concerns: Concern[]
  skinTypes: SkinType[]
  hairTypes: HairType[]
  ingredients: string
  howToUse: LocalizedText
  deliveryEstimate: string
  sku: string
  barcode: string
  gender: Gender
  professionalProduct: boolean
  /** Units sold — used for "best selling" sort */
  salesCount: number
  createdAt: string
}

export interface Brand {
  id: string
  slug: string
  name: string
  nameAr: string
  country: string
  description: LocalizedText
  image: string
  isFeatured: boolean
  professional?: boolean
}

export interface Subcategory {
  slug: string
  name: LocalizedText
  image?: string
}

export interface Category {
  slug: string
  name: LocalizedText
  description: LocalizedText
  image: string
  subcategories: Subcategory[]
}

export interface Review {
  id: string
  productId: string
  author: string
  city: string
  rating: number
  title: string
  comment: string
  date: string
  verified: boolean
  helpful: number
}

export interface Testimonial {
  id: string
  name: string
  city: LocalizedText
  rating: number
  text: LocalizedText
  productSlug?: string
}

export interface Banner {
  id: string
  eyebrow: LocalizedText
  title: LocalizedText
  subtitle: LocalizedText
  ctaLabel: LocalizedText
  ctaHref: string
  secondaryCtaLabel?: LocalizedText
  secondaryCtaHref?: string
  image: string
  mobileImage: string
  /** Text color treatment over the image */
  tone: 'light' | 'dark'
}

export interface Offer {
  id: string
  title: LocalizedText
  description: LocalizedText
  code?: string
  discountLabel: LocalizedText
  image: string
  href: string
  endsAt: string
}

export interface Coupon {
  code: string
  type: 'percent' | 'fixed'
  value: number
  minSubtotal?: number
  description: LocalizedText
}

export interface Address {
  id: string
  label: string
  fullName: string
  phone: string
  city: CityId
  district: string
  street: string
  building: string
  apartment?: string
  postalCode: string
  isDefault: boolean
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  gender?: 'female' | 'male' | ''
  dateOfBirth?: string
  loyaltyPoints: number
  memberSince: string
  isProfessional?: boolean
}

export type OrderStatus =
  | 'processing'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export type ShippingMethod = 'standard' | 'express'

export interface OrderItem {
  productId: string
  slug: string
  name: string
  brandName: string
  image: string
  price: number
  quantity: number
  variantLabel?: string
}

export interface OrderTimelineStep {
  status: OrderStatus | 'placed'
  date?: string
  done: boolean
}

export interface Order {
  id: string
  number: string
  createdAt: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  discount: number
  vat: number
  shipping: number
  total: number
  shippingMethod: ShippingMethod
  paymentMethod: PaymentMethodId
  address: Address
  estimatedDelivery: string
  timeline: OrderTimelineStep[]
  couponCode?: string
}

/**
 * A cart line keeps a price/display snapshot so the cart renders without
 * re-fetching the catalog (the server will re-price on checkout).
 */
export interface CartItem {
  /** productId + variant key, unique per line */
  key: string
  productId: string
  slug: string
  name: string
  brandName: string
  image: string
  price: number
  compareAtPrice?: number
  quantity: number
  maxQuantity: number
  shadeId?: string
  sizeId?: string
  variantLabel?: string
  professional?: boolean
}

export interface AppliedCoupon {
  code: string
  type: 'percent' | 'fixed'
  value: number
  minSubtotal?: number
}

export interface CartTotals {
  itemCount: number
  subtotal: number
  discount: number
  vat: number
  shipping: number
  total: number
  /** Amount left to reach free standard shipping (0 when reached) */
  freeShippingRemaining: number
  freeShippingProgress: number
}

export interface NotificationItem {
  id: string
  type: 'order' | 'offer' | 'new_arrival' | 'tip'
  title: LocalizedText
  body: LocalizedText
  date: string
  read: boolean
  href?: string
}

export type ReturnStatus = 'requested' | 'approved' | 'pickup_scheduled' | 'received' | 'refunded'

export interface ReturnRequest {
  id: string
  orderNumber: string
  productName: string
  reason: string
  description: string
  status: ReturnStatus
  createdAt: string
}

export interface SupportTicket {
  id: string
  subject: string
  message: string
  status: 'open' | 'answered' | 'closed'
  createdAt: string
}

export interface LoyaltyReward {
  id: string
  title: LocalizedText
  points: number
  description: LocalizedText
}

export interface LoyaltyActivity {
  id: string
  label: LocalizedText
  points: number
  date: string
}

/* ---------- Catalog query ---------- */

export type SortOption =
  | 'featured'
  | 'newest'
  | 'best-selling'
  | 'price-asc'
  | 'price-desc'
  | 'rating'
  | 'discount'

export type PriceRange = '0-100' | '100-250' | '250-500' | '500+'

export interface ProductFilters {
  category?: string
  subcategory?: string
  brands?: string[]
  priceRanges?: PriceRange[]
  minRating?: number
  minDiscount?: number
  inStockOnly?: boolean
  skinTypes?: SkinType[]
  hairTypes?: HairType[]
  concerns?: Concern[]
  professionalOnly?: boolean
  onSaleOnly?: boolean
  query?: string
}

export interface SearchSuggestions {
  products: Product[]
  brands: Brand[]
  categories: { slug: string; name: LocalizedText; parent?: string }[]
}
