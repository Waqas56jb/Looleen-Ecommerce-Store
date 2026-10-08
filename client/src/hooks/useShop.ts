import { useCallback } from 'react'
import { toast } from 'sonner'
import { translate, useT } from '@/i18n'
import { useCartStore } from '@/store/cart'
import { useUIStore } from '@/store/ui'
import { useWishlistStore } from '@/store/wishlist'
import type { Product } from '@/types'

/**
 * Shared cart/wishlist actions with toasts — use these from any component
 * instead of calling the stores directly so feedback stays consistent.
 */
export function useShopActions() {
  const { t } = useT()
  const addItem = useCartStore((s) => s.addItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const toggleWish = useWishlistStore((s) => s.toggle)
  const setCartOpen = useUIStore((s) => s.setCartOpen)

  const addToCart = useCallback(
    (product: Product, opts?: { quantity?: number; shadeId?: string; sizeId?: string; openCart?: boolean }) => {
      if (product.stockStatus === 'out_of_stock') {
        toast.error(t('toast.outOfStock'))
        return false
      }
      const line = addItem(product, opts)
      if (opts?.openCart) setCartOpen(true)
      else
        toast.success(t('toast.addedToCart'), {
          description: `${product.brandName} · ${product.name}${line.variantLabel ? ` — ${line.variantLabel}` : ''}`,
          action: { label: t('common.checkout'), onClick: () => setCartOpen(true) },
        })
      return true
    },
    [addItem, setCartOpen, t],
  )

  const removeFromCart = useCallback(
    (key: string) => {
      removeItem(key)
      toast(t('toast.removedFromCart'))
    },
    [removeItem, t],
  )

  const toggleWishlist = useCallback(
    (product: Pick<Product, 'id' | 'name'>) => {
      const added = toggleWish(product.id)
      if (added) toast.success(t('toast.addedToWishlist'), { description: product.name })
      else toast(t('toast.removedFromWishlist'), { description: product.name })
      return added
    },
    [toggleWish, t],
  )

  return { addToCart, removeFromCart, toggleWishlist }
}

/** Non-hook translate for places outside React (rare) */
export const tNow = (key: string, vars?: Record<string, string | number>) => translate(useUIStore.getState().lang, key, vars)
