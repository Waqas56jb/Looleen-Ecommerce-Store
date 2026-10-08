/**
 * Inventory API (mock). available = stock − reserved.
 */
import { all, write } from '@/store/db'
import { useAuthStore } from '@/store/authStore'
import type { InventoryStatus, ListQuery, Paginated, StockMovement, StockMovementType } from '@/types'
import { delay, nowIso, queryList, uid } from '@/utils'
import { inventoryStatus, logActivity, NotFoundError, pushNotification } from './_core'

export interface InventoryRow {
  productId: string
  name: string
  brandName: string
  image: string
  sku: string
  stock: number
  reserved: number
  available: number
  threshold: number
  status: InventoryStatus
  costPrice: number
  price: number
  value: number
  lastUpdated: string
}

function rows(): InventoryRow[] {
  const brands = all('brands')
  const moves = all('movements')
  return all('products').map((p) => {
    const last = moves.filter((m) => m.productId === p.id).sort((a, b) => b.date.localeCompare(a.date))[0]
    return {
      productId: p.id,
      name: p.name,
      brandName: brands.find((b) => b.id === p.brandId)?.name ?? p.brandId,
      image: p.images[0],
      sku: p.sku,
      stock: p.stock,
      reserved: p.reserved,
      available: Math.max(0, p.stock - p.reserved),
      threshold: p.lowStockThreshold,
      status: inventoryStatus(p.stock, p.lowStockThreshold),
      costPrice: p.costPrice,
      price: p.price,
      value: Math.round(p.stock * p.costPrice * 100) / 100,
      lastUpdated: last && last.date > p.updatedAt ? last.date : p.updatedAt,
    }
  })
}

export function getInventory(q: ListQuery & { filters?: { status?: InventoryStatus | InventoryStatus[] } } = {}): Promise<Paginated<InventoryRow>> {
  const st = q.filters?.status
  const list = rows().filter((r) => !st || (Array.isArray(st) ? !st.length || st.includes(r.status) : r.status === st))
  return delay(queryList(list, { sortBy: 'available', sortDir: 'asc', ...q }, { searchFields: [(r) => r.name, (r) => r.sku, (r) => r.brandName] }))
}

export async function getInventoryStats() {
  const list = rows()
  return delay({
    totalUnits: list.reduce((s, r) => s + r.stock, 0),
    inventoryValue: Math.round(list.reduce((s, r) => s + r.value, 0)),
    retailValue: Math.round(list.reduce((s, r) => s + r.stock * r.price, 0)),
    lowStock: list.filter((r) => r.status === 'low_stock').length,
    outOfStock: list.filter((r) => r.status === 'out_of_stock').length,
  })
}

export function getInventoryItem(productId: string): Promise<InventoryRow | undefined> {
  return delay(rows().find((r) => r.productId === productId))
}

export function getLowStock(limit = 8): Promise<InventoryRow[]> {
  return delay(
    rows()
      .filter((r) => r.status !== 'in_stock')
      .sort((a, b) => a.stock - b.stock)
      .slice(0, limit),
  )
}

export function getStockMovements(productId?: string): Promise<StockMovement[]> {
  const list = all('movements').filter((m) => !productId || m.productId === productId)
  return delay([...list].sort((a, b) => b.date.localeCompare(a.date)))
}

export interface AdjustStockInput {
  productId: string
  type: StockMovementType
  /** Positive number; direction comes from `direction` */
  quantity: number
  direction: 'in' | 'out'
  reason: string
  notes?: string
  reference?: string
}

/** Records a movement and updates the product stock */
export async function adjustStock(input: AdjustStockInput): Promise<InventoryRow> {
  const product = all('products').find((p) => p.id === input.productId)
  if (!product) throw new NotFoundError('Product', input.productId)
  const signed = (input.direction === 'in' ? 1 : -1) * Math.abs(input.quantity)
  const stock = Math.max(0, product.stock + signed)
  const movement: StockMovement = {
    id: uid('mv'),
    productId: product.id,
    type: input.type,
    quantity: signed,
    reference: input.reference || (input.type === 'purchase' ? `PO-${Date.now().toString().slice(-6)}` : 'Manual'),
    reason: input.reason,
    notes: input.notes,
    user: useAuthStore.getState().admin?.name ?? 'System',
    date: nowIso(),
  }
  write('movements', [movement, ...all('movements')])
  write('products', all('products').map((p) => (p.id === product.id ? { ...p, stock, reserved: Math.min(p.reserved, stock), updatedAt: nowIso() } : p)))
  logActivity('adjusted', 'inventory', `Stock adjusted for '${product.name}' (${signed > 0 ? '+' : ''}${signed}, ${input.reason}).`, product.id)
  const status = inventoryStatus(stock, product.lowStockThreshold)
  if (status !== 'in_stock' && inventoryStatus(product.stock, product.lowStockThreshold) === 'in_stock') {
    pushNotification('low_stock', status === 'out_of_stock' ? `Out of stock: ${product.name}` : `Low stock: ${product.name}`, `${stock} units left (threshold ${product.lowStockThreshold}).`, `/inventory/${product.id}`)
  }
  return (await getInventoryItem(product.id))!
}

export async function setThreshold(productId: string, threshold: number): Promise<void> {
  write('products', all('products').map((p) => (p.id === productId ? { ...p, lowStockThreshold: threshold, updatedAt: nowIso() } : p)))
  return delay(undefined)
}
