import type { LucideIcon } from 'lucide-react'
import { BarChart3, Bell, Boxes, LayoutDashboard, Megaphone, MessageSquareText, Package, Palette, Settings, ShoppingBag, Undo2, UserCircle, Users } from 'lucide-react'
import type { Permission } from '@/types'

export interface NavChild {
  labelKey: string
  to: string
  /** Matching query string for "active" state, e.g. "status=pending" */
  match?: string
}

export interface NavGroup {
  id: string
  labelKey: string
  icon: LucideIcon
  to?: string
  children?: NavChild[]
  permission?: Permission
  /** Count badge source */
  badge?: 'pendingOrders' | 'pendingReviews' | 'openReturns'
}

export const NAV: NavGroup[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, to: '/dashboard', permission: 'dashboard' },
  {
    id: 'catalog',
    labelKey: 'nav.catalog',
    icon: Package,
    permission: 'products',
    children: [
      { labelKey: 'nav.products', to: '/products' },
      { labelKey: 'nav.categories', to: '/categories' },
      { labelKey: 'nav.brands', to: '/brands' },
      { labelKey: 'nav.inventory', to: '/inventory' },
    ],
  },
  {
    id: 'orders',
    labelKey: 'nav.orders',
    icon: ShoppingBag,
    permission: 'orders',
    badge: 'pendingOrders',
    children: [
      { labelKey: 'nav.allOrders', to: '/orders' },
      { labelKey: 'nav.pending', to: '/orders?status=pending', match: 'status=pending' },
      { labelKey: 'nav.processing', to: '/orders?status=processing', match: 'status=processing' },
      { labelKey: 'nav.shipped', to: '/orders?status=shipped', match: 'status=shipped' },
      { labelKey: 'nav.delivered', to: '/orders?status=delivered', match: 'status=delivered' },
      { labelKey: 'nav.cancelled', to: '/orders?status=cancelled', match: 'status=cancelled' },
    ],
  },
  { id: 'returns', labelKey: 'nav.returns', icon: Undo2, to: '/returns', permission: 'returns', badge: 'openReturns' },
  {
    id: 'customers',
    labelKey: 'nav.customers',
    icon: Users,
    permission: 'customers',
    children: [
      { labelKey: 'nav.allCustomers', to: '/customers' },
      { labelKey: 'nav.professional', to: '/customers/professional' },
      { labelKey: 'nav.vip', to: '/customers?segment=vip', match: 'segment=vip' },
    ],
  },
  {
    id: 'marketing',
    labelKey: 'nav.marketing',
    icon: Megaphone,
    permission: 'marketing',
    children: [
      { labelKey: 'nav.coupons', to: '/coupons' },
      { labelKey: 'nav.campaigns', to: '/campaigns' },
      { labelKey: 'nav.offers', to: '/offers' },
    ],
  },
  {
    id: 'content',
    labelKey: 'nav.content',
    icon: Palette,
    permission: 'content',
    children: [
      { labelKey: 'nav.banners', to: '/banners' },
      { labelKey: 'nav.homepage', to: '/content/homepage' },
    ],
  },
  {
    id: 'reviews',
    labelKey: 'nav.reviews',
    icon: MessageSquareText,
    permission: 'reviews',
    badge: 'pendingReviews',
    children: [
      { labelKey: 'nav.allReviews', to: '/reviews' },
      { labelKey: 'nav.moderation', to: '/reviews?status=pending', match: 'status=pending' },
    ],
  },
  {
    id: 'reports',
    labelKey: 'nav.reports',
    icon: BarChart3,
    permission: 'reports',
    children: [
      { labelKey: 'nav.overview', to: '/reports' },
      { labelKey: 'nav.sales', to: '/reports/sales' },
      { labelKey: 'nav.productReports', to: '/reports/products' },
      { labelKey: 'nav.customerReports', to: '/reports/customers' },
    ],
  },
  {
    id: 'system',
    labelKey: 'nav.system',
    icon: Bell,
    children: [
      { labelKey: 'nav.notifications', to: '/notifications' },
      { labelKey: 'nav.activity', to: '/activity' },
    ],
  },
  { id: 'settings', labelKey: 'nav.settings', icon: Settings, to: '/settings', permission: 'settings' },
  { id: 'profile', labelKey: 'nav.profile', icon: UserCircle, to: '/profile' },
]

/** Flat command-palette targets */
export const COMMANDS: { labelKey: string; to: string; icon: LucideIcon; keywords: string }[] = [
  { labelKey: 'nav.dashboard', to: '/dashboard', icon: LayoutDashboard, keywords: 'home overview kpi' },
  { labelKey: 'nav.products', to: '/products', icon: Package, keywords: 'catalog items sku' },
  { labelKey: 'nav.orders', to: '/orders', icon: ShoppingBag, keywords: 'sales purchases' },
  { labelKey: 'nav.customers', to: '/customers', icon: Users, keywords: 'clients users' },
  { labelKey: 'nav.brands', to: '/brands', icon: Package, keywords: 'distributors' },
  { labelKey: 'nav.inventory', to: '/inventory', icon: Boxes, keywords: 'stock warehouse' },
  { labelKey: 'nav.coupons', to: '/coupons', icon: Megaphone, keywords: 'discount codes promo' },
  { labelKey: 'nav.reviews', to: '/reviews', icon: MessageSquareText, keywords: 'ratings moderation' },
  { labelKey: 'nav.returns', to: '/returns', icon: Undo2, keywords: 'refunds rma' },
  { labelKey: 'nav.reports', to: '/reports', icon: BarChart3, keywords: 'analytics sales charts' },
  { labelKey: 'nav.settings', to: '/settings', icon: Settings, keywords: 'configuration store payment shipping tax' },
]
