/**
 * Marketing & content API (mock): coupons, campaigns, offers, banners,
 * homepage sections.
 */
import { all, write } from '@/store/db'
import type { Banner, Campaign, Coupon, CouponStatus, HomepageSection, ListQuery, Offer, Paginated } from '@/types'
import { delay, nowIso, queryList, uid } from '@/utils'
import { couponStatus, dateWindowStatus, inList, logActivity, NotFoundError } from './_core'

/* ================================ Coupons ================================ */

export interface CouponRow extends Coupon {
  status: CouponStatus
}

const withStatus = (c: Coupon): CouponRow => ({ ...c, status: couponStatus(c) })

export function getCoupons(q: ListQuery & { filters?: { status?: CouponStatus | CouponStatus[]; type?: string } } = {}): Promise<Paginated<CouponRow>> {
  const f = q.filters ?? {}
  const list = all('coupons').map(withStatus).filter((c) => inList(c.status, f.status) && (!f.type || c.type === f.type))
  return delay(queryList(list, { sortBy: 'createdAt', sortDir: 'desc', ...q }, { searchFields: [(c) => c.code, (c) => c.description] }))
}

export async function getCouponStats() {
  const list = all('coupons').map(withStatus)
  return delay({
    active: list.filter((c) => c.status === 'active').length,
    scheduled: list.filter((c) => c.status === 'scheduled').length,
    expired: list.filter((c) => c.status === 'expired').length,
    disabled: list.filter((c) => c.status === 'disabled').length,
    redemptions: list.reduce((s, c) => s + c.used, 0),
    discountGiven: list.reduce((s, c) => s + c.discountGiven, 0),
  })
}

export function getCoupon(id: string): Promise<CouponRow | undefined> {
  const c = all('coupons').find((x) => x.id === id)
  return delay(c ? withStatus(c) : undefined)
}

export function isCouponCodeTaken(code: string, exceptId?: string) {
  return all('coupons').some((c) => c.code.toUpperCase() === code.toUpperCase() && c.id !== exceptId)
}

export type CouponInput = Omit<Coupon, 'id' | 'used' | 'discountGiven' | 'createdAt'>

export async function createCoupon(input: CouponInput): Promise<Coupon> {
  const coupon: Coupon = { ...input, code: input.code.toUpperCase(), id: uid('cp'), used: 0, discountGiven: 0, createdAt: nowIso() }
  write('coupons', [coupon, ...all('coupons')])
  logActivity('created', 'coupon', `Coupon ${coupon.code} was created.`, coupon.id)
  return delay(coupon)
}

export async function updateCoupon(id: string, patch: Partial<Coupon>): Promise<Coupon> {
  const c = all('coupons').find((x) => x.id === id)
  if (!c) throw new NotFoundError('Coupon', id)
  const updated = { ...c, ...patch, code: (patch.code ?? c.code).toUpperCase(), id }
  write('coupons', all('coupons').map((x) => (x.id === id ? updated : x)))
  logActivity('updated', 'coupon', `Coupon ${updated.code} was updated.`, id)
  return delay(updated)
}

export async function deleteCoupon(id: string) {
  const c = all('coupons').find((x) => x.id === id)
  write('coupons', all('coupons').filter((x) => x.id !== id))
  logActivity('deleted', 'coupon', `Coupon ${c?.code} was deleted.`, id)
  return delay(undefined)
}

/* =============================== Campaigns =============================== */

export function getCampaigns(q: ListQuery & { filters?: { status?: string; type?: string } } = {}): Promise<Paginated<Campaign>> {
  const f = q.filters ?? {}
  const list = all('campaigns').filter((c) => (!f.status || c.status === f.status) && (!f.type || c.type === f.type))
  return delay(queryList(list, { sortBy: 'startDate', sortDir: 'desc', ...q }, { searchFields: [(c) => c.name, (c) => c.nameAr, (c) => c.couponCode] }))
}

export async function getCampaignStats() {
  const list = all('campaigns')
  return delay({
    active: list.filter((c) => c.status === 'active').length,
    scheduled: list.filter((c) => c.status === 'scheduled').length,
    revenue: list.reduce((s, c) => s + c.revenue, 0),
    orders: list.reduce((s, c) => s + c.orders, 0),
    budget: list.reduce((s, c) => s + c.budget, 0),
  })
}

export type CampaignInput = Omit<Campaign, 'id' | 'revenue' | 'orders' | 'createdAt'>

export async function saveCampaign(input: CampaignInput, id?: string): Promise<Campaign> {
  if (id) {
    const c = all('campaigns').find((x) => x.id === id)
    if (!c) throw new NotFoundError('Campaign', id)
    const updated = { ...c, ...input, id }
    write('campaigns', all('campaigns').map((x) => (x.id === id ? updated : x)))
    logActivity('updated', 'campaign', `Campaign '${updated.name}' was updated.`, id)
    return delay(updated)
  }
  const created: Campaign = { ...input, id: uid('cm'), revenue: 0, orders: 0, createdAt: nowIso() }
  write('campaigns', [created, ...all('campaigns')])
  logActivity('created', 'campaign', `Campaign '${created.name}' was created.`, created.id)
  return delay(created)
}

export async function deleteCampaign(id: string) {
  const c = all('campaigns').find((x) => x.id === id)
  write('campaigns', all('campaigns').filter((x) => x.id !== id))
  logActivity('deleted', 'campaign', `Campaign '${c?.name}' was deleted.`, id)
  return delay(undefined)
}

/* ================================= Offers ================================= */

const offerStatus = (o: Offer): Offer['status'] => (o.status === 'disabled' ? 'disabled' : dateWindowStatus(o.startDate, o.endDate))

export function getOffers(q: ListQuery & { filters?: { status?: string } } = {}): Promise<Paginated<Offer>> {
  const list = all('offers')
    .map((o) => ({ ...o, status: offerStatus(o) }))
    .filter((o) => !q.filters?.status || o.status === q.filters.status)
  return delay(queryList(list, { sortBy: 'startDate', sortDir: 'desc', ...q }, { searchFields: [(o) => o.title, (o) => o.titleAr] }))
}

export type OfferInput = Omit<Offer, 'id' | 'createdAt'>

export async function saveOffer(input: OfferInput, id?: string): Promise<Offer> {
  if (id) {
    const o = all('offers').find((x) => x.id === id)
    if (!o) throw new NotFoundError('Offer', id)
    const updated = { ...o, ...input, id }
    write('offers', all('offers').map((x) => (x.id === id ? updated : x)))
    logActivity('updated', 'offer', `Offer '${updated.title}' was updated.`, id)
    return delay(updated)
  }
  const created: Offer = { ...input, id: uid('of'), createdAt: nowIso() }
  write('offers', [created, ...all('offers')])
  logActivity('created', 'offer', `Offer '${created.title}' was created.`, created.id)
  return delay(created)
}

export async function deleteOffer(id: string) {
  const o = all('offers').find((x) => x.id === id)
  write('offers', all('offers').filter((x) => x.id !== id))
  logActivity('deleted', 'offer', `Offer '${o?.title}' was deleted.`, id)
  return delay(undefined)
}

/* ================================ Banners ================================ */

export function getBanners(q: ListQuery & { filters?: { status?: string; placement?: string } } = {}): Promise<Paginated<Banner>> {
  const f = q.filters ?? {}
  const list = all('banners').filter((b) => (!f.status || b.status === f.status) && (!f.placement || b.placement === f.placement))
  return delay(queryList(list, { sortBy: 'sortOrder', sortDir: 'asc', pageSize: 50, ...q }, { searchFields: [(b) => b.title, (b) => b.titleAr, (b) => b.ctaUrl] }))
}

export function getBanner(id: string): Promise<Banner | undefined> {
  return delay(all('banners').find((b) => b.id === id))
}

export type BannerInput = Omit<Banner, 'id' | 'clicks' | 'impressions' | 'createdAt'>

export async function createBanner(input: BannerInput): Promise<Banner> {
  const b: Banner = { ...input, id: uid('bn'), clicks: 0, impressions: 0, createdAt: nowIso() }
  write('banners', [...all('banners'), b])
  logActivity('created', 'banner', `Banner '${b.title}' was created.`, b.id)
  return delay(b)
}

export async function updateBanner(id: string, patch: Partial<Banner>): Promise<Banner> {
  const b = all('banners').find((x) => x.id === id)
  if (!b) throw new NotFoundError('Banner', id)
  const updated = { ...b, ...patch, id }
  write('banners', all('banners').map((x) => (x.id === id ? updated : x)))
  logActivity('updated', 'banner', `Banner '${updated.title}' was updated.`, id)
  return delay(updated)
}

export async function publishBanner(id: string, publish = true): Promise<Banner> {
  const updated = await updateBanner(id, { status: publish ? 'published' : 'draft' })
  logActivity(publish ? 'published' : 'unpublished', 'banner', `Banner '${updated.title}' was ${publish ? 'published' : 'unpublished'}.`, id)
  return updated
}

export async function duplicateBanner(id: string): Promise<Banner> {
  const b = all('banners').find((x) => x.id === id)
  if (!b) throw new NotFoundError('Banner', id)
  return createBanner({ ...b, title: `${b.title} (Copy)`, status: 'draft', sortOrder: b.sortOrder + 1 })
}

export async function deleteBanner(id: string) {
  const b = all('banners').find((x) => x.id === id)
  write('banners', all('banners').filter((x) => x.id !== id))
  logActivity('deleted', 'banner', `Banner '${b?.title}' was deleted.`, id)
  return delay(undefined)
}

/* ============================ Homepage sections ============================ */

export function getHomepageSections(): Promise<HomepageSection[]> {
  return delay([...all('homepage')].sort((a, b) => a.order - b.order))
}

export async function saveHomepageSections(sections: HomepageSection[]): Promise<HomepageSection[]> {
  const normalized = sections.map((s, i) => ({ ...s, order: i + 1 }))
  write('homepage', normalized)
  logActivity('updated', 'content', 'Homepage sections were updated.')
  return delay(normalized)
}
