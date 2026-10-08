import type { CityId, PaymentMethodId } from '@/config/store'

export type { CityId, PaymentMethodId }
export type Lang = 'en' | 'ar'

export interface LocalizedText {
  en: string
  ar: string
}

/* ============================== Admin users ============================== */

export type AdminRole = 'super_admin' | 'store_manager' | 'product_manager' | 'order_manager' | 'customer_support' | 'content_manager' | 'inventory_manager'

export type Permission =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'brands'
  | 'inventory'
  | 'orders'
  | 'returns'
  | 'customers'
  | 'reviews'
  | 'marketing'
  | 'content'
  | 'reports'
  | 'settings'
  | 'activity'

export interface AdminUser {
  id: string
  name: string
  email: string
  phone: string
  role: AdminRole
  avatar?: string
  lastLoginAt?: string
  status: 'active' | 'invited' | 'disabled'
}

/* ============================== Catalog ============================== */

export type ProductStatus = 'active' | 'draft' | 'archived'

export interface ProductVariant {
  id: string
  kind: 'shade' | 'size' | 'pack'
  name: string
  /** Shade swatch color (kind = shade) */
  hex?: string
  sku: string
  price: number
  stock: number
  image?: string
  status: 'active' | 'inactive'
}

export interface ProductSEO {
  title: string
  description: string
  keywords: string[]
}

export interface ProductFlags {
  original: boolean
  authorized: boolean
  featured: boolean
  bestSeller: boolean
  trending: boolean
  newArrival: boolean
  sale: boolean
  professional: boolean
}

export interface AdminProduct {
  id: string
  name: string
  nameAr: string
  slug: string
  brandId: string
  /** Top-level category id */
  categoryId: string
  /** Subcategory id */
  subcategoryId: string
  sku: string
  barcode: string
  shortDescription: LocalizedText
  description: LocalizedText
  ingredients: string
  howToUse: LocalizedText
  price: number
  compareAtPrice?: number
  costPrice: number
  stock: number
  reserved: number
  lowStockThreshold: number
  weightGrams: number
  images: string[]
  variants: ProductVariant[]
  flags: ProductFlags
  seo: ProductSEO
  tags: string[]
  rating: number
  reviewCount: number
  unitsSold: number
  revenue: number
  views: number
  addToCarts: number
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

export type DerivedProductStatus = ProductStatus | 'out_of_stock'

export interface AdminBrand {
  id: string
  name: string
  nameAr: string
  slug: string
  logo?: string
  banner: string
  description: LocalizedText
  country: string
  website: string
  distributor: string
  authorized: boolean
  featured: boolean
  status: 'active' | 'inactive'
  createdAt: string
}

export interface AdminCategory {
  id: string
  name: LocalizedText
  slug: string
  parentId: string | null
  description: LocalizedText
  image: string
  seoTitle: string
  seoDescription: string
  status: 'active' | 'inactive'
  sortOrder: number
  createdAt: string
}

/* ============================== Inventory ============================== */

export type StockMovementType = 'purchase' | 'sale' | 'return' | 'adjustment' | 'damage'
export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export interface StockMovement {
  id: string
  productId: string
  type: StockMovementType
  /** Signed quantity: + adds stock, − removes */
  quantity: number
  reference: string
  reason?: string
  notes?: string
  user: string
  date: string
}

/* ============================== Orders ============================== */

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type ShippingMethod = 'standard' | 'express'

export interface Address {
  fullName: string
  phone: string
  city: CityId
  district: string
  street: string
  building: string
  apartment?: string
  postalCode: string
}

export interface OrderItem {
  productId: string
  name: string
  brandName: string
  sku: string
  image: string
  variant?: string
  quantity: number
  unitPrice: number
  discount: number
}

export interface OrderEvent {
  id: string
  status: OrderStatus | 'placed' | 'note'
  date: string
  by: string
  note?: string
}

export interface AdminOrder {
  id: string
  number: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  discount: number
  couponCode?: string
  vat: number
  shipping: number
  total: number
  paymentMethod: PaymentMethodId
  paymentStatus: PaymentStatus
  shippingMethod: ShippingMethod
  trackingNumber?: string
  carrier?: string
  status: OrderStatus
  address: Address
  notes: { id: string; text: string; by: string; date: string }[]
  timeline: OrderEvent[]
  createdAt: string
  updatedAt: string
}

/* ============================== Customers ============================== */

export type CustomerType = 'regular' | 'professional' | 'vip'
export type SalonType = 'hair_salon' | 'nail_salon' | 'beauty_clinic' | 'spa' | 'makeup_studio' | 'barbershop'

export interface AdminCustomer {
  id: string
  name: string
  email: string
  phone: string
  city: CityId
  gender: 'female' | 'male'
  customerType: CustomerType
  businessName?: string
  businessType?: SalonType
  contactPerson?: string
  status: 'active' | 'inactive'
  loyaltyPoints: number
  ordersCount: number
  totalSpent: number
  lastOrderAt?: string
  registeredAt: string
  addresses: Address[]
  wishlist: string[]
  tags: string[]
}

export interface SupportTicket {
  id: string
  customerId: string
  subject: string
  status: 'open' | 'answered' | 'closed'
  createdAt: string
}

/* ============================== Marketing ============================== */

export type CouponType = 'percentage' | 'fixed' | 'free_shipping'
export type CouponStatus = 'active' | 'scheduled' | 'expired' | 'disabled'
export type CustomerSegment = 'all' | 'new' | 'vip' | 'professional' | 'inactive'

export interface Coupon {
  id: string
  code: string
  description: string
  type: CouponType
  value: number
  minOrder: number
  maxDiscount?: number
  usageLimit?: number
  perCustomerLimit?: number
  used: number
  discountGiven: number
  startDate: string
  endDate: string
  categoryIds: string[]
  brandIds: string[]
  segment: CustomerSegment
  enabled: boolean
  createdAt: string
}

export type CampaignType = 'flash_sale' | 'seasonal' | 'brand_promotion' | 'new_collection' | 'salon_professional' | 'ramadan' | 'national_day' | 'white_friday'
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'ended'

export interface Campaign {
  id: string
  name: string
  nameAr: string
  type: CampaignType
  status: CampaignStatus
  startDate: string
  endDate: string
  budget: number
  revenue: number
  orders: number
  channels: ('email' | 'sms' | 'push' | 'instagram' | 'tiktok' | 'onsite')[]
  couponCode?: string
  createdAt: string
}

export interface Offer {
  id: string
  title: string
  titleAr: string
  description: string
  banner: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  productIds: string[]
  categoryIds: string[]
  brandIds: string[]
  startDate: string
  endDate: string
  status: 'active' | 'scheduled' | 'expired' | 'disabled'
  createdAt: string
}

export type BannerPlacement = 'homepage_hero' | 'editorial' | 'category' | 'promotional' | 'mobile_hero'

export interface Banner {
  id: string
  title: string
  titleAr: string
  subtitle: string
  subtitleAr: string
  imageDesktop: string
  imageMobile: string
  ctaLabel: string
  ctaLabelAr: string
  ctaUrl: string
  placement: BannerPlacement
  startDate: string
  endDate: string
  status: 'published' | 'draft' | 'scheduled'
  sortOrder: number
  clicks: number
  impressions: number
  createdAt: string
}

export interface HomepageSection {
  id: string
  key: string
  title: string
  titleAr: string
  enabled: boolean
  order: number
  /** Short description of what the section shows */
  note: string
}

/* ============================== Reviews & returns ============================== */

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden'

export interface AdminReview {
  id: string
  productId: string
  productName: string
  customerId: string
  customerName: string
  rating: number
  title: string
  body: string
  images: string[]
  verified: boolean
  status: ReviewStatus
  reply?: { text: string; by: string; date: string }
  helpful: number
  createdAt: string
}

export type ReturnStatus = 'requested' | 'approved' | 'pickup_scheduled' | 'received' | 'refunded' | 'rejected'

export interface ReturnRequest {
  id: string
  number: string
  orderId: string
  orderNumber: string
  customerId: string
  customerName: string
  productId: string
  productName: string
  productImage: string
  quantity: number
  reason: string
  description: string
  images: string[]
  amount: number
  status: ReturnStatus
  timeline: { status: ReturnStatus; date: string; by: string; note?: string }[]
  createdAt: string
}

/* ============================== System ============================== */

export type NotificationType = 'new_order' | 'low_stock' | 'new_customer' | 'return_request' | 'review_pending' | 'campaign_ending' | 'order_update' | 'system'

export interface AdminNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  href?: string
  read: boolean
  date: string
}

export type ActivityAction = 'created' | 'updated' | 'deleted' | 'status_changed' | 'published' | 'unpublished' | 'approved' | 'rejected' | 'refunded' | 'adjusted' | 'login' | 'logout' | 'exported' | 'archived' | 'duplicated'
export type ActivityEntity = 'product' | 'order' | 'customer' | 'brand' | 'category' | 'coupon' | 'campaign' | 'offer' | 'banner' | 'review' | 'return' | 'inventory' | 'settings' | 'session' | 'content'

export interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: ActivityAction
  entity: ActivityEntity
  entityId?: string
  description: string
  ip: string
  status: 'success' | 'failed'
  date: string
}

export interface StoreSettings {
  general: { storeName: string; storeEmail: string; supportPhone: string; whatsapp: string; address: string; logoUrl: string; faviconUrl: string }
  store: {
    currency: string
    currencySymbol: string
    freeShippingThreshold: number
    defaultShippingFee: number
    expressShippingFee: number
    orderMinimum: number
    enableCod: boolean
    enableReviews: boolean
    enableWishlist: boolean
    enableLoyalty: boolean
  }
  payments: Record<PaymentMethodId, boolean>
  shipping: {
    methods: { id: ShippingMethod; name: string; nameAr: string; price: number; freeThreshold: number; estimate: string; enabled: boolean }[]
    regions: { city: CityId; enabled: boolean; standardDays: string; expressDays: string }[]
  }
  tax: { vatEnabled: boolean; vatRate: number; display: 'inclusive' | 'exclusive'; vatNumber: string }
  localization: { defaultLanguage: Lang; supported: Lang[]; currency: string; timezone: string; dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' }
  notifications: { newOrder: boolean; lowStock: boolean; newCustomer: boolean; returnRequest: boolean; reviewPending: boolean; dailySummary: boolean }
}

/* ============================== Analytics ============================== */

export type DateRange = 'today' | 'yesterday' | '7d' | '30d' | '90d' | '12m' | 'year'

export interface KpiValue {
  value: number
  previous: number
  /** percentage change vs previous period */
  change: number
}

export interface DashboardStats {
  revenue: KpiValue
  orders: KpiValue
  customers: KpiValue
  productsSold: KpiValue
  pendingOrders: number
  lowStock: number
  returns: number
  averageOrderValue: KpiValue
}

export interface SeriesPoint {
  label: string
  revenue: number
  orders: number
  customers?: number
  aov?: number
}

/* ============================== Lists ============================== */

export interface ListQuery {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  /** Service-specific filter object (each service narrows this type) */
  filters?: unknown
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
