import { useEffect, useState, type RefObject } from 'react'
import { Button, Price, SmartImage } from '@/components/common'
import { useT } from '@/i18n'
import type { Product } from '@/types'
import { cn } from '@/utils'
import type { PurchaseState } from './ProductInfo'

/**
 * Mobile-only bottom bar that appears once the main Add to Cart button has
 * scrolled above the viewport. Sits above the WhatsApp button (z-45 vs z-40).
 */
export function StickyAddToCart({ product, purchase, targetRef }: { product: Product; purchase: PurchaseState; targetRef: RefObject<HTMLElement | null> }) {
  const { t } = useT()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = targetRef.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([entry]) => {
      // Only show after the buttons have scrolled *past* (above) the viewport
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [targetRef])

  return (
    <div
      role="region"
      aria-label={t('product.sticky.label')}
      aria-hidden={!visible}
      inert={!visible}
      className={cn(
        'fixed inset-x-0 bottom-0 z-[45] border-t border-line bg-ivory/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lift backdrop-blur transition-transform duration-300 ease-out lg:hidden',
        visible ? 'translate-y-0' : 'pointer-events-none translate-y-full',
      )}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        <SmartImage src={product.thumbnail} alt="" width={96} height={120} wrapperClassName="hidden aspect-[4/5] w-10 shrink-0 rounded-xs min-[400px]:block" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted">{product.name}</p>
          <Price price={purchase.price.price} compareAtPrice={purchase.price.compareAtPrice} size="sm" />
        </div>
        {purchase.outOfStock ? (
          <Button size="sm" variant="outline" className="h-11" onClick={purchase.notifyMe}>
            {t('common.notifyMe')}
          </Button>
        ) : (
          <>
            <Button size="sm" variant="dark" className="h-11 px-4" onClick={purchase.buyNow}>
              {t('common.buyNow')}
            </Button>
            <Button size="sm" className="h-11 px-4" onClick={purchase.addToCart}>
              {t('common.addToCart')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
