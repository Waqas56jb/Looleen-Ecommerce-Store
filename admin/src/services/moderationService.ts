/**
 * Reviews & returns API (mock).
 */
import { all, write } from '@/store/db'
import { currentAdminName } from '@/store/authStore'
import type { AdminReview, ListQuery, Paginated, ReturnRequest, ReturnStatus, ReviewStatus } from '@/types'
import { delay, formatPrice, nowIso, queryList } from '@/utils'
import { inList, logActivity, NotFoundError } from './_core'

/* ================================ Reviews ================================ */

export function getReviews(q: ListQuery & { filters?: { status?: ReviewStatus | ReviewStatus[]; rating?: number; productId?: string; customerId?: string } } = {}): Promise<Paginated<AdminReview>> {
  const f = q.filters ?? {}
  const list = all('reviews').filter((r) => inList(r.status, f.status) && (!f.rating || r.rating === f.rating) && (!f.productId || r.productId === f.productId) && (!f.customerId || r.customerId === f.customerId))
  return delay(queryList(list, { sortBy: 'createdAt', sortDir: 'desc', ...q }, { searchFields: [(r) => r.productName, (r) => r.customerName, (r) => r.title, (r) => r.body] }))
}

export async function getReviewStats() {
  const list = all('reviews')
  return delay({
    total: list.length,
    pending: list.filter((r) => r.status === 'pending').length,
    approved: list.filter((r) => r.status === 'approved').length,
    rejected: list.filter((r) => r.status === 'rejected').length,
    hidden: list.filter((r) => r.status === 'hidden').length,
    average: Math.round((list.reduce((s, r) => s + r.rating, 0) / Math.max(1, list.length)) * 10) / 10,
  })
}

export function getReview(id: string): Promise<AdminReview | undefined> {
  return delay(all('reviews').find((r) => r.id === id))
}

function setReviewStatus(ids: string[], status: ReviewStatus) {
  const set = new Set(ids)
  write('reviews', all('reviews').map((r) => (set.has(r.id) ? { ...r, status } : r)))
}

export async function approveReview(id: string) {
  setReviewStatus([id], 'approved')
  const r = all('reviews').find((x) => x.id === id)
  logActivity('approved', 'review', `Review on '${r?.productName}' by ${r?.customerName} was approved.`, id)
  return delay(r)
}

export async function rejectReview(id: string) {
  setReviewStatus([id], 'rejected')
  const r = all('reviews').find((x) => x.id === id)
  logActivity('rejected', 'review', `Review on '${r?.productName}' by ${r?.customerName} was rejected.`, id)
  return delay(r)
}

export async function hideReview(id: string) {
  setReviewStatus([id], 'hidden')
  logActivity('updated', 'review', `Review ${id} was hidden.`, id)
  return delay(all('reviews').find((x) => x.id === id))
}

export async function bulkModerateReviews(ids: string[], status: 'approved' | 'rejected') {
  setReviewStatus(ids, status)
  logActivity(status === 'approved' ? 'approved' : 'rejected', 'review', `${ids.length} reviews were ${status}.`)
  return delay(ids.length)
}

export async function deleteReview(id: string) {
  const r = all('reviews').find((x) => x.id === id)
  write('reviews', all('reviews').filter((x) => x.id !== id))
  logActivity('deleted', 'review', `Review on '${r?.productName}' was deleted.`, id)
  return delay(undefined)
}

export async function replyToReview(id: string, text: string) {
  write('reviews', all('reviews').map((r) => (r.id === id ? { ...r, reply: { text, by: currentAdminName(), date: nowIso() } } : r)))
  logActivity('updated', 'review', `Replied to review ${id}.`, id)
  return delay(all('reviews').find((x) => x.id === id))
}

/* ================================ Returns ================================ */

export const RETURN_FLOW: ReturnStatus[] = ['requested', 'approved', 'pickup_scheduled', 'received', 'refunded']

export function getReturns(q: ListQuery & { filters?: { status?: ReturnStatus | ReturnStatus[]; customerId?: string } } = {}): Promise<Paginated<ReturnRequest>> {
  const f = q.filters ?? {}
  const list = all('returns').filter((r) => inList(r.status, f.status) && (!f.customerId || r.customerId === f.customerId))
  return delay(queryList(list, { sortBy: 'createdAt', sortDir: 'desc', ...q }, { searchFields: [(r) => r.number, (r) => r.orderNumber, (r) => r.customerName, (r) => r.productName, (r) => r.reason] }))
}

export async function getReturnStats() {
  const list = all('returns')
  const c = (s: ReturnStatus) => list.filter((r) => r.status === s).length
  return delay({
    total: list.length,
    requested: c('requested'),
    approved: c('approved'),
    pickup: c('pickup_scheduled'),
    received: c('received'),
    refunded: c('refunded'),
    rejected: c('rejected'),
    refundedAmount: list.filter((r) => r.status === 'refunded').reduce((s, r) => s + r.amount, 0),
  })
}

export function getReturn(id: string): Promise<ReturnRequest | undefined> {
  return delay(all('returns').find((r) => r.id === id || r.number === id))
}

export async function updateReturnStatus(id: string, status: ReturnStatus, note?: string): Promise<ReturnRequest> {
  const list = all('returns')
  const r = list.find((x) => x.id === id)
  if (!r) throw new NotFoundError('Return', id)
  const updated: ReturnRequest = { ...r, status, timeline: [...r.timeline, { status, date: nowIso(), by: currentAdminName(), note }] }
  write('returns', list.map((x) => (x.id === id ? updated : x)))
  logActivity(status === 'refunded' ? 'refunded' : status === 'rejected' ? 'rejected' : status === 'approved' ? 'approved' : 'status_changed', 'return', `Return ${r.number} ${status === 'refunded' ? `was refunded (${formatPrice(r.amount)})` : `moved to ${status.replace('_', ' ')}`}.`, id)
  return delay(updated)
}

export const approveReturn = (id: string, note?: string) => updateReturnStatus(id, 'approved', note)
export const rejectReturn = (id: string, note?: string) => updateReturnStatus(id, 'rejected', note)
