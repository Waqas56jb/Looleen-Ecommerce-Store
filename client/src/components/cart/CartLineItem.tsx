import { Link } from 'react-router-dom'
import { Heart, X } from 'lucide-react'
import { toast } from 'sonner'
import { Price, QuantitySelector, SmartImage } from '@/components/common'
import { useShopActions } from '@/hooks/useShop'
import { useT } from '@/i18n'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import type { CartItem } from '@/types'
import { formatPrice } from '@/utils'

/** One line on the full cart page */
export function CartLineItem({ item }: { item: CartItem }) {
  const { t, lang } = useT()
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const inWishlist = useWishlistStore((s) => s.ids.includes(item.productId))
  const { removeFromCart, toggleWishlist } = useShopActions()

  const moveToWishlist = () => {
    if (!inWishlist) toggleWishlist({ id: item.productId, name: item.name })
    else toast.success(t('cart.movedToWishlist'), { description: item.name })
    removeItem(item.key)
  }

  const href = `/product/${item.slug}`
  return (
    <li className="animate-fade-in flex gap-4 py-6 sm:gap-6">
      <Link to={href} className="shrink-0" tabIndex={-1} aria-hidden>
        <SmartImage src={item.image} alt="" width={240} height={300} wrapperClassName="w-24 sm:w-32 aspect-[4/5] rounded-xs" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold tracking-[0.16em] text-muted uppercase">{item.brandName}</p>
            <Link to={href} className="mt-1 line-clamp-2 text-[15px] leading-snug text-ink transition-colors hover:text-rose sm:text-base">
              {item.name}
            </Link>
            {item.variantLabel && <p className="mt-1 text-xs text-muted">{item.variantLabel}</p>}
            <p className="mt-1.5 text-xs text-muted tabular-nums">{t('cart.each', { price: formatPrice(item.price, lang) })}</p>
          </div>
          <div className="hidden text-end sm:block">
            <p className="sr-only">{t('cart.lineTotal')}</p>
            <Price price={item.price * item.quantity} compareAtPrice={item.compareAtPrice ? item.compareAtPrice * item.quantity : undefined} className="flex-col items-end gap-0!" />
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-4">
          <QuantitySelector size="sm" value={item.quantity} max={item.maxQuantity} onChange={(q) => updateQuantity(item.key, q)} />
          <div className="sm:hidden">
            <Price price={item.price * item.quantity} compareAtPrice={item.compareAtPrice ? item.compareAtPrice * item.quantity : undefined} size="sm" />
          </div>
          <div className="flex w-full items-center gap-5 text-xs sm:w-auto">
            <button type="button" onClick={moveToWishlist} className="inline-flex min-h-11 items-center gap-1.5 text-muted transition-colors hover:text-rose sm:min-h-0">
              <Heart className="size-3.5" aria-hidden />
              {t('cart.moveToWishlist')}
            </button>
            <button
              type="button"
              onClick={() => removeFromCart(item.key)}
              aria-label={`${t('common.remove')} ${item.name}`}
              className="inline-flex min-h-11 items-center gap-1.5 text-muted transition-colors hover:text-error sm:min-h-0"
            >
              <X className="size-3.5" aria-hidden />
              {t('common.remove')}
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}
