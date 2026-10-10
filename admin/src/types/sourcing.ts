/**
 * Sourcing & approval — supplier costs, competitor prices and the LOOKS
 * publication approval. A product can only be approved when it has a
 * verified supplier cost AND verified prices of the exact same product at
 * the required number of Saudi retailers.
 */

export interface Supplier {
  id: string
  name: string
  /** Price list document provided by LOOKS */
  priceList: string
  priceListDate: string
  itemsInList: number
  priceBasis: string
  contact: string
  /** Supplier costs are always VAT-exclusive */
  vatIncluded: false
}

/** How a retailer's price reaches the system */
export type RetailerCollection = 'automatic' | 'manual'

export interface Retailer {
  id: string
  name: string
  url: string
  collection: RetailerCollection
  /** Why prices are collected this way */
  note: string
  noteAr?: string
  /** Search URL template — {q} is replaced by barcode or name */
  searchUrl: string
  /** Only relevant for these brands (e.g. the Keune brand store) */
  brands?: string[]
}

export interface SupplierOffer {
  supplierId: string
  code: string
  nameOnList: string
  sizeOnList: string
  listPrice: number | null
  discount: number
  /** Net purchase cost, SAR excl. VAT */
  netCost: number
  priceBasis: string
  sourcePage: number | null
  /** Cost confirmed by LOOKS against the supplier quotation */
  costVerified?: boolean
  costVerifiedBy?: string
  costVerifiedAt?: string
}

export type PriceSource = 'automatic' | 'manual'
export type MatchBy = 'barcode' | 'name_size'

export interface CompetitorPrice {
  id: string
  retailerId: string
  /** SAR incl. VAT, as shown to shoppers */
  price: number
  originalPrice: number | null
  /** Seller on marketplaces (Amazon.sa / Noon); the store itself otherwise */
  seller: string
  inStock: boolean
  url: string
  source: PriceSource
  matchBy: MatchBy
  listedName: string
  verifiedAt: string
  verifiedBy: string
  note?: string
}

export type SourcingStatus = 'incomplete' | 'ready' | 'approved' | 'rejected'

export interface SourcingEvent {
  at: string
  by: string
  action: 'imported' | 'cost_verified' | 'price_added' | 'price_updated' | 'price_removed' | 'approved' | 'rejected' | 'reopened'
  note: string
}

export interface SourcingDecision {
  status: 'approved' | 'rejected'
  by: string
  at: string
  looksPrice?: number
  cost?: number
  margin?: number
  retailers?: number
  note: string
}

export interface SourcingProduct {
  id: string
  brand: string
  nameEn: string
  nameAr: string
  size: string
  barcode: string
  categoryEn: string
  categoryAr: string
  offers: SupplierOffer[]
  prices: CompetitorPrice[]
  /** Proposed LOOKS selling price, SAR incl. VAT */
  looksPrice?: number
  decision?: SourcingDecision
  history: SourcingEvent[]
}

export type SourcingSeedProduct = Omit<SourcingProduct, 'history' | 'looksPrice' | 'decision'>

export interface ApprovalRules {
  /** Exact same product verified at this many Saudi retailers */
  minRetailers: number
  /** Competitor prices older than this must be re-checked */
  maxPriceAgeDays: number
  /** Margins below this are flagged (not blocked) */
  minMargin: number
  /** Supplier cost must be confirmed against the quotation */
  requireVerifiedCost: boolean
}

export type CheckId = 'supplier' | 'cost' | 'retailers' | 'fresh' | 'price' | 'margin'

export interface ApprovalCheck {
  id: CheckId
  ok: boolean
  /** Blocking checks prevent approval; others are warnings */
  blocking: boolean
  /** i18n key + vars */
  key: string
  vars?: Record<string, string | number>
}

export interface MarketSummary {
  retailers: number
  fresh: number
  min: number | null
  max: number | null
  avg: number | null
  median: number | null
  lowestAt: string | null
}

export interface SourcingRow extends SourcingProduct {
  status: SourcingStatus
  cost: number | null
  supplierName: string
  market: MarketSummary
  /** Gross margin at the average market price (excl. VAT) */
  marginAtAvg: number | null
  checks: ApprovalCheck[]
}
