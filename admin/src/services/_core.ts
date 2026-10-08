/**
 * Internal helpers shared by mock services. Not imported by UI.
 */
import { all, write } from '@/store/db'
import { useAuthStore } from '@/store/authStore'
import type { ActivityAction, ActivityEntity, AdminNotification, AdminProduct, Coupon, CouponStatus, DerivedProductStatus, InventoryStatus, NotificationType } from '@/types'
import { nowIso, uid } from '@/utils'

const MOCK_IP = '94.97.112.18'

export function logActivity(action: ActivityAction, entity: ActivityEntity, description: string, entityId?: string, status: 'success' | 'failed' = 'success') {
  const admin = useAuthStore.getState().admin
  write('activity', [
    { id: uid('act'), userId: admin?.id ?? 'system', userName: admin?.name ?? 'System', action, entity, entityId, description, ip: MOCK_IP, status, date: nowIso() },
    ...all('activity'),
  ])
}

export function pushNotification(type: NotificationType, title: string, body: string, href?: string) {
  const n: AdminNotification = { id: uid('nt'), type, title, body, href, read: false, date: nowIso() }
  write('notifications', [n, ...all('notifications')])
  return n
}

/** Not found error for services */
export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} ${id} not found`)
  }
}

/* ---------------- Derived statuses ---------------- */

export function productStatus(p: AdminProduct): DerivedProductStatus {
  if (p.status === 'active' && p.stock <= 0) return 'out_of_stock'
  return p.status
}

export function inventoryStatus(stock: number, threshold: number): InventoryStatus {
  if (stock <= 0) return 'out_of_stock'
  if (stock <= threshold) return 'low_stock'
  return 'in_stock'
}

export function couponStatus(c: Coupon, at = Date.now()): CouponStatus {
  if (!c.enabled) return 'disabled'
  if (new Date(c.startDate).getTime() > at) return 'scheduled'
  if (new Date(c.endDate).getTime() < at) return 'expired'
  if (c.usageLimit && c.used >= c.usageLimit) return 'expired'
  return 'active'
}

export function dateWindowStatus(start: string, end: string, at = Date.now()): 'scheduled' | 'active' | 'expired' {
  if (new Date(start).getTime() > at) return 'scheduled'
  if (new Date(end).getTime() < at) return 'expired'
  return 'active'
}

export function inList<T>(value: T, list: T | T[] | undefined): boolean {
  if (list === undefined || (Array.isArray(list) && list.length === 0) || list === '') return true
  return Array.isArray(list) ? list.includes(value) : list === value
}
