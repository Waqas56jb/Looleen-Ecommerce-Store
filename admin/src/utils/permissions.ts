import type { AdminRole, Permission } from '@/types'

/**
 * Frontend permission map. Real authorization will be enforced by the
 * server; this only shapes the UI (hide nav items, disable actions).
 */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[] | 'all'> = {
  super_admin: 'all',
  store_manager: ['dashboard', 'products', 'categories', 'brands', 'inventory', 'orders', 'returns', 'customers', 'reviews', 'marketing', 'content', 'reports', 'activity'],
  product_manager: ['dashboard', 'products', 'brands', 'categories', 'inventory'],
  order_manager: ['dashboard', 'orders', 'returns', 'customers'],
  customer_support: ['dashboard', 'customers', 'orders', 'reviews', 'returns'],
  content_manager: ['dashboard', 'content', 'marketing', 'reviews'],
  inventory_manager: ['dashboard', 'inventory', 'products'],
}

export const ROLE_LABELS: Record<AdminRole, { en: string; ar: string }> = {
  super_admin: { en: 'Super Admin', ar: 'مدير عام' },
  store_manager: { en: 'Store Manager', ar: 'مدير المتجر' },
  product_manager: { en: 'Product Manager', ar: 'مدير المنتجات' },
  order_manager: { en: 'Order Manager', ar: 'مدير الطلبات' },
  customer_support: { en: 'Customer Support', ar: 'دعم العملاء' },
  content_manager: { en: 'Content Manager', ar: 'مدير المحتوى' },
  inventory_manager: { en: 'Inventory Manager', ar: 'مدير المخزون' },
}

export function can(role: AdminRole | undefined, permission: Permission): boolean {
  if (!role) return false
  const perms = ROLE_PERMISSIONS[role]
  return perms === 'all' || perms.includes(permission)
}

export function permissionsOf(role: AdminRole): Permission[] {
  const perms = ROLE_PERMISSIONS[role]
  return perms === 'all' ? (['dashboard', 'products', 'categories', 'brands', 'inventory', 'orders', 'returns', 'customers', 'reviews', 'marketing', 'content', 'reports', 'settings', 'activity'] as Permission[]) : perms
}
