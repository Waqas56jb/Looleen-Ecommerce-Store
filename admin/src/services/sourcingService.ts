/**
 * Sourcing & approval API (mock). Enforces the LOOKS publication rule:
 * a product stays inactive until it has a verified supplier cost and
 * verified prices of the exact same product at the required number of
 * Saudi retailers; only then can a LOOKS price be approved.
 */
import { all, rulesDb, write } from '@/store/db'
import { useAuthStore } from '@/store/authStore'
import type { ListQuery, Paginated } from '@/types'
import type { ApprovalCheck, ApprovalRules, CompetitorPrice, MarketSummary, Retailer, SourcingEvent, SourcingProduct, SourcingRow, SourcingStatus, Supplier } from '@/types/sourcing'
import { delay, nowIso, queryList, uid } from '@/utils'
import { logActivity, NotFoundError } from './_core'

export const VAT = 0.15
const DAY = 86_400_000

const actor = () => useAuthStore.getState().admin?.name ?? 'Admin'
const round2 = (n: number) => Math.round(n * 100) / 100

/** Gross margin on the VAT-exclusive selling price */
export function marginAt(priceInclVat: number, cost: number) {
  const ex = priceInclVat / (1 + VAT)
  return { ex: round2(ex), profit: round2(ex - cost), margin: ex > 0 ? (ex - cost) / ex : 0 }
}

export function isFresh(c: CompetitorPrice, rules: ApprovalRules, at = Date.now()) {
  return at - new Date(c.verifiedAt).getTime() <= rules.maxPriceAgeDays * DAY
}

/** One price per retailer (lowest), fresh prices only */
export function marketOf(p: SourcingProduct, rules: ApprovalRules, retailers: Retailer[]): MarketSummary {
  const perRetailer = new Map<string, CompetitorPrice>()
  for (const c of p.prices) {
    if (!isFresh(c, rules)) continue
    const cur = perRetailer.get(c.retailerId)
    if (!cur || c.price < cur.price) perRetailer.set(c.retailerId, c)
  }
  const prices = [...perRetailer.values()].map((c) => c.price).sort((a, b) => a - b)
  const mid = Math.floor(prices.length / 2)
  const lowest = [...perRetailer.values()].sort((a, b) => a.price - b.price)[0]
  return {
    retailers: new Set(p.prices.map((c) => c.retailerId)).size,
    fresh: perRetailer.size,
    min: prices.length ? prices[0] : null,
    max: prices.length ? prices[prices.length - 1] : null,
    avg: prices.length ? round2(prices.reduce((a, b) => a + b, 0) / prices.length) : null,
    median: !prices.length ? null : prices.length % 2 ? prices[mid] : round2((prices[mid - 1] + prices[mid]) / 2),
    lowestAt: lowest ? (retailers.find((r) => r.id === lowest.retailerId)?.name ?? lowest.seller) : null,
  }
}

/** Purchase cost used for margins: lowest verified offer (or lowest offer when verification is not required) */
export function costOf(p: SourcingProduct, rules: ApprovalRules) {
  const usable = p.offers.filter((o) => o.costVerified || !rules.requireVerifiedCost)
  const best = [...usable].sort((a, b) => a.netCost - b.netCost)[0]
  return best ?? null
}

export function checksOf(p: SourcingProduct, rules: ApprovalRules, market: MarketSummary): ApprovalCheck[] {
  const best = costOf(p, rules)
  const stale = p.prices.filter((c) => !isFresh(c, rules)).length
  const m = best && p.looksPrice ? marginAt(p.looksPrice, best.netCost).margin : null
  return [
    { id: 'supplier', ok: p.offers.length > 0, blocking: true, key: p.offers.length ? 'checks.supplierOk' : 'checks.supplierMissing', vars: { count: p.offers.length } },
    {
      id: 'cost',
      ok: !rules.requireVerifiedCost || p.offers.some((o) => o.costVerified),
      blocking: true,
      key: !rules.requireVerifiedCost ? 'checks.costNotRequired' : p.offers.some((o) => o.costVerified) ? 'checks.costOk' : 'checks.costMissing',
    },
    {
      id: 'retailers',
      ok: market.fresh >= rules.minRetailers,
      blocking: true,
      key: market.fresh >= rules.minRetailers ? 'checks.retailersOk' : 'checks.retailersMissing',
      vars: { count: market.fresh, min: rules.minRetailers, need: Math.max(0, rules.minRetailers - market.fresh) },
    },
    { id: 'fresh', ok: stale === 0, blocking: false, key: stale ? 'checks.stale' : 'checks.freshOk', vars: { count: stale, days: rules.maxPriceAgeDays } },
    { id: 'price', ok: !!p.looksPrice, blocking: true, key: p.looksPrice ? 'checks.priceOk' : 'checks.priceMissing' },
    {
      id: 'margin',
      ok: m === null || m >= rules.minMargin,
      blocking: false,
      key: m === null ? 'checks.marginPending' : m < 0 ? 'checks.marginNegative' : m < rules.minMargin ? 'checks.marginLow' : 'checks.marginOk',
      vars: { margin: m === null ? 0 : Math.round(m * 1000) / 10, min: Math.round(rules.minMargin * 100) },
    },
  ]
}

function statusOf(p: SourcingProduct, checks: ApprovalCheck[]): SourcingStatus {
  if (p.decision) return p.decision.status
  return checks.filter((c) => c.blocking && c.id !== 'price').every((c) => c.ok) ? 'ready' : 'incomplete'
}

function toRow(p: SourcingProduct): SourcingRow {
  const rules = rulesDb.getState().rules
  const retailers = all('retailers')
  const market = marketOf(p, rules, retailers)
  const checks = checksOf(p, rules, market)
  const best = costOf(p, rules)
  const suppliers = all('suppliers')
  return {
    ...p,
    status: statusOf(p, checks),
    cost: best?.netCost ?? null,
    supplierName: best ? (suppliers.find((s) => s.id === best.supplierId)?.name ?? best.supplierId) : (p.offers[0] ? (suppliers.find((s) => s.id === p.offers[0].supplierId)?.name ?? '') : ''),
    market,
    marginAtAvg: best && market.avg ? marginAt(market.avg, best.netCost).margin : null,
    checks,
  }
}

/* ---------------- Queries ---------------- */

export interface SourcingFilters {
  status?: SourcingStatus
  brand?: string
}

export async function getSourcingRows(q: ListQuery & { filters?: SourcingFilters }): Promise<Paginated<SourcingRow>> {
  let rows = all('sourcing').map(toRow)
  if (q.filters?.status) rows = rows.filter((r) => r.status === q.filters!.status)
  if (q.filters?.brand) rows = rows.filter((r) => r.brand === q.filters!.brand)
  return delay(
    queryList(rows, q, {
      searchFields: [(r) => r.id, (r) => r.nameEn, (r) => r.nameAr, (r) => r.barcode, (r) => r.brand, (r) => r.offers.map((o) => o.code).join(' ')],
      sortFields: {
        cost: (r) => r.cost ?? -1,
        retailers: (r) => r.market.fresh,
        avg: (r) => r.market.avg ?? -1,
        margin: (r) => r.marginAtAvg ?? -99,
        status: (r) => r.status,
      },
    }),
  )
}

export async function getSourcingStats() {
  const rows = all('sourcing').map(toRow)
  const by = (s: SourcingStatus) => rows.filter((r) => r.status === s).length
  return delay({
    total: rows.length,
    incomplete: by('incomplete'),
    ready: by('ready'),
    approved: by('approved'),
    rejected: by('rejected'),
    brands: [...new Set(rows.map((r) => r.brand))].sort(),
    retailerPrices: rows.reduce((n, r) => n + r.prices.length, 0),
  })
}

export async function getSourcingProduct(id: string) {
  const p = all('sourcing').find((x) => x.id === id)
  if (!p) return delay(null)
  return delay({ row: toRow(p), suppliers: all('suppliers'), retailers: all('retailers'), rules: rulesDb.getState().rules })
}

export async function getSuppliersOverview() {
  const rows = all('sourcing').map(toRow)
  return delay(
    all('suppliers').map((s) => {
      const mine = rows.filter((r) => r.offers.some((o) => o.supplierId === s.id))
      const margins = mine.map((r) => r.marginAtAvg).filter((m): m is number => m !== null)
      return {
        supplier: s,
        products: mine.length,
        approved: mine.filter((r) => r.status === 'approved').length,
        ready: mine.filter((r) => r.status === 'ready').length,
        avgMargin: margins.length ? margins.reduce((a, b) => a + b, 0) / margins.length : null,
        rows: mine,
      }
    }),
  )
}

export async function getRetailers() {
  return delay(all('retailers'))
}

export async function getRules() {
  return delay(rulesDb.getState().rules)
}

export async function saveRules(rules: ApprovalRules) {
  rulesDb.getState().setRules(rules)
  logActivity('updated', 'settings', `Product approval rules: ${rules.minRetailers} retailers, prices ≤ ${rules.maxPriceAgeDays} days, margin warning < ${Math.round(rules.minMargin * 100)}%`)
  return delay(rules)
}

/* ---------------- Mutations ---------------- */

function mutate(id: string, fn: (p: SourcingProduct) => SourcingProduct) {
  const list = all('sourcing')
  const i = list.findIndex((x) => x.id === id)
  if (i < 0) throw new NotFoundError('Sourcing product', id)
  const next = fn(structuredClone(list[i]))
  write('sourcing', list.map((x, j) => (j === i ? next : x)))
  return next
}

const event = (action: SourcingEvent['action'], note: string): SourcingEvent => ({ at: nowIso(), by: actor(), action, note })

export interface PriceInput {
  retailerId: string
  price: number
  originalPrice: number | null
  seller: string
  inStock: boolean
  url: string
  matchBy: CompetitorPrice['matchBy']
  listedName: string
  verifiedAt: string
  note?: string
}

/** Record a manually verified retailer price (Amazon.sa, Noon, brand stores…) */
export async function savePrice(productId: string, input: PriceInput, priceId?: string) {
  const retailer = all('retailers').find((r) => r.id === input.retailerId)
  const p = mutate(productId, (p) => {
    const rec: CompetitorPrice = { id: priceId ?? uid('cp'), ...input, source: 'manual', verifiedBy: actor() }
    p.prices = priceId ? p.prices.map((c) => (c.id === priceId ? rec : c)) : [...p.prices, rec]
    // A changed market invalidates an earlier decision → back to review
    if (p.decision) {
      p.history.push(event('reopened', 'Competitor prices changed after the decision — review again'))
      p.decision = undefined
    }
    p.history.push(event(priceId ? 'price_updated' : 'price_added', `${retailer?.name ?? input.retailerId} (seller: ${input.seller}): SAR ${input.price.toFixed(2)} — manually verified`))
    return p
  })
  logActivity('updated', 'product', `${p.id}: ${retailer?.name} price ${input.price.toFixed(2)} SAR verified manually`, p.id)
  return delay(toRow(p))
}

export async function removePrice(productId: string, priceId: string) {
  const p = mutate(productId, (p) => {
    const c = p.prices.find((x) => x.id === priceId)
    p.prices = p.prices.filter((x) => x.id !== priceId)
    if (p.decision) {
      p.history.push(event('reopened', 'Competitor prices changed after the decision — review again'))
      p.decision = undefined
    }
    if (c) p.history.push(event('price_removed', `${c.seller}: SAR ${c.price.toFixed(2)} removed`))
    return p
  })
  return delay(toRow(p))
}

export async function verifyCost(productId: string, supplierId: string, code: string) {
  const p = mutate(productId, (p) => {
    p.offers = p.offers.map((o) => (o.supplierId === supplierId && o.code === code ? { ...o, costVerified: true, costVerifiedBy: actor(), costVerifiedAt: nowIso() } : o))
    p.history.push(event('cost_verified', `Supplier cost ${code} confirmed`))
    return p
  })
  return delay(toRow(p))
}

export async function setLooksPrice(productId: string, price: number | undefined) {
  const p = mutate(productId, (p) => ({ ...p, looksPrice: price && price > 0 ? round2(price) : undefined }))
  return delay(toRow(p))
}

export class ApprovalBlockedError extends Error {}

export async function approveProduct(productId: string, note: string) {
  const current = all('sourcing').find((x) => x.id === productId)
  if (!current) throw new NotFoundError('Sourcing product', productId)
  const row = toRow(current)
  const blockers = row.checks.filter((c) => c.blocking && !c.ok)
  if (blockers.length) throw new ApprovalBlockedError(blockers.map((b) => b.id).join(','))
  const m = marginAt(row.looksPrice!, row.cost!)
  const p = mutate(productId, (p) => {
    p.decision = { status: 'approved', by: actor(), at: nowIso(), looksPrice: p.looksPrice, cost: row.cost!, margin: m.margin, retailers: row.market.fresh, note }
    p.history.push(event('approved', `Approved for publication at SAR ${p.looksPrice!.toFixed(2)} — margin ${(m.margin * 100).toFixed(1)}%, compared at ${row.market.fresh} retailers${note ? ` — ${note}` : ''}`))
    return p
  })
  logActivity('approved', 'product', `${p.id} approved for publication at ${p.looksPrice!.toFixed(2)} SAR`, p.id)
  return delay(toRow(p))
}

export async function rejectProduct(productId: string, note: string) {
  const p = mutate(productId, (p) => {
    p.decision = { status: 'rejected', by: actor(), at: nowIso(), note }
    p.history.push(event('rejected', note || 'Rejected'))
    return p
  })
  logActivity('rejected', 'product', `${p.id} rejected: ${note}`, p.id)
  return delay(toRow(p))
}

export async function reopenProduct(productId: string) {
  const p = mutate(productId, (p) => {
    p.decision = undefined
    p.history.push(event('reopened', 'Decision withdrawn — product back to inactive review'))
    return p
  })
  logActivity('status_changed', 'product', `${p.id} back to review (inactive)`, p.id)
  return delay(toRow(p))
}

/** Manual-check search link for a retailer (barcode first, else brand + name + size) */
export function searchLink(r: Retailer, p: Pick<SourcingProduct, 'barcode' | 'brand' | 'nameEn' | 'size'>) {
  const q = r.collection === 'manual' && p.barcode && r.id === 'amazon' ? p.barcode : `${p.nameEn.toLowerCase().includes(p.brand.split(' ')[0].toLowerCase()) ? '' : `${p.brand} `}${p.nameEn} ${p.size}`.trim()
  return r.searchUrl.replace('{q}', encodeURIComponent(q))
}

export type { Supplier }
