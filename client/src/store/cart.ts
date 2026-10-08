import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORE_CONFIG } from '@/config/store'
import type { AppliedCoupon, CartItem, CartTotals, Product, ShippingMethod } from '@/types'
import { unitPrice, variantLabel } from '@/utils/catalog'

interface AddOptions {
  quantity?: number
  shadeId?: string
  sizeId?: string
}

interface CartState {
  items: CartItem[]
  coupon: AppliedCoupon | null
  /** Bumps on every add — header badge uses it to replay the bump animation */
  lastAddedAt: number
  addItem: (product: Product, opts?: AddOptions) => CartItem
  removeItem: (key: string) => void
  updateQuantity: (key: string, quantity: number) => void
  clearCart: () => void
  setCoupon: (coupon: AppliedCoupon | null) => void
  removeCoupon: () => void
}

export const lineKey = (productId: string, shadeId?: string, sizeId?: string) => [productId, shadeId ?? '-', sizeId ?? '-'].join('|')

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      lastAddedAt: 0,
      addItem: (product, opts = {}) => {
        const shadeId = opts.shadeId ?? product.shades[0]?.id
        const sizeId = opts.sizeId ?? product.sizes[0]?.id
        const key = lineKey(product.id, shadeId, sizeId)
        const qty = Math.max(1, opts.quantity ?? 1)
        const { price, compareAtPrice } = unitPrice(product, sizeId)
        const maxQuantity = Math.max(1, Math.min(product.stock, 10))
        const existing = get().items.find((i) => i.key === key)
        let line: CartItem
        if (existing) {
          line = { ...existing, quantity: Math.min(existing.quantity + qty, existing.maxQuantity) }
          set({ items: get().items.map((i) => (i.key === key ? line : i)), lastAddedAt: Date.now() })
        } else {
          line = {
            key,
            productId: product.id,
            slug: product.slug,
            name: product.name,
            brandName: product.brandName,
            image: product.thumbnail,
            price,
            compareAtPrice,
            quantity: Math.min(qty, maxQuantity),
            maxQuantity,
            shadeId,
            sizeId,
            variantLabel: variantLabel(product, shadeId, sizeId),
            professional: product.professionalProduct,
          }
          set({ items: [line, ...get().items], lastAddedAt: Date.now() })
        }
        return line
      },
      removeItem: (key) => set({ items: get().items.filter((i) => i.key !== key) }),
      updateQuantity: (key, quantity) =>
        set({
          items: get()
            .items.map((i) => (i.key === key ? { ...i, quantity: Math.min(Math.max(0, quantity), i.maxQuantity) } : i))
            .filter((i) => i.quantity > 0),
        }),
      clearCart: () => set({ items: [], coupon: null }),
      setCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),
    }),
    {
      name: `${STORE_CONFIG.storagePrefix}cart`,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, coupon: s.coupon }),
    },
  ),
)

const round2 = (n: number) => Math.round(n * 100) / 100

/** Pure totals calculator — shared by cart drawer, cart page and checkout */
export function computeTotals(items: CartItem[], coupon: AppliedCoupon | null, method: ShippingMethod = 'standard'): CartTotals {
  const subtotal = round2(items.reduce((s, i) => s + i.price * i.quantity, 0))
  const couponValid = coupon && (!coupon.minSubtotal || subtotal >= coupon.minSubtotal)
  const discount = couponValid ? round2(coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : Math.min(coupon.value, subtotal)) : 0
  const taxable = subtotal - discount
  const vat = round2(taxable * STORE_CONFIG.vatRate)
  const threshold = STORE_CONFIG.freeShippingThreshold
  const freeStandard = taxable >= threshold
  const shipping = items.length === 0 ? 0 : method === 'express' ? STORE_CONFIG.shipping.express.price : freeStandard ? 0 : STORE_CONFIG.shipping.standard.price
  return {
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    subtotal,
    discount,
    vat,
    shipping,
    total: round2(taxable + vat + shipping),
    freeShippingRemaining: freeStandard ? 0 : round2(threshold - taxable),
    freeShippingProgress: Math.min(1, taxable / threshold),
  }
}

/** Hook: live totals for the current cart */
export function useCartTotals(method: ShippingMethod = 'standard'): CartTotals {
  const items = useCartStore((s) => s.items)
  const coupon = useCartStore((s) => s.coupon)
  return computeTotals(items, coupon, method)
}
