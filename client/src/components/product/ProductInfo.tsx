import { useState, type Ref } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Heart, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { AuthenticityMessage, AuthorizedBadge, Badge, Button, OriginalBadge, Price, QuantitySelector, RatingStars } from '@/components/common'
import { useShopActions } from '@/hooks/useShop'
import { useT } from '@/i18n'
import { useWishlistStore } from '@/store/wishlist'
import type { Product } from '@/types'
import { cn, formatPrice } from '@/utils'
import { DeliveryInfo } from './DeliveryInfo'
import { VariantSelector } from './VariantSelector'

export interface PurchaseState {
  shadeId?: string
  sizeId?: string
  quantity: number
  setShadeId: (id: string) => void
  setSizeId: (id: string) => void
  setQuantity: (n: number) => void
  price: { price: number; compareAtPrice?: number }
  outOfStock: boolean
  maxQuantity: number
  addToCart: () => void
  buyNow: () => void
  notifyMe: () => void
}

function StockStatus({ product }: { product: Product }) {
  const { t } = useT()
  const status = product.stockStatus
  return (
    <p className="flex items-center gap-2 text-[13px] font-medium" role="status">
      <span
        className={cn('size-2 rounded-full', status === 'in_stock' && 'bg-success', status === 'low_stock' && 'animate-pulse bg-warning', status === 'out_of_stock' && 'bg-error')}
        aria-hidden
      />
      <span className={cn(status === 'in_stock' && 'text-success', status === 'low_stock' && 'text-warning', status === 'out_of_stock' && 'text-error')}>
        {status === 'in_stock' && t('common.inStock')}
        {status === 'low_stock' && t('product.onlyLeft', { count: product.stock })}
        {status === 'out_of_stock' && t('common.outOfStock')}
      </span>
    </p>
  )
}

async function shareProduct(product: Product, text: string, copiedLabel: string) {
  const url = window.location.href
  if (navigator.share) {
    try {
      await navigator.share({ title: product.name, text, url })
      return
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    toast.success(copiedLabel)
  } catch {
    toast(url)
  }
}

interface ProductInfoProps {
  product: Product
  purchase: PurchaseState
  mainButtonRef?: Ref<HTMLDivElement>
}

/** Right-hand buy box on the product page */
export function ProductInfo({ product, purchase, mainButtonRef }: ProductInfoProps) {
  const { t, l, lang } = useT()
  const { toggleWishlist } = useShopActions()
  const wished = useWishlistStore((s) => s.ids.includes(product.id))
  const [pop, setPop] = useState(false)
  const { price, compareAtPrice } = purchase.price
  const saving = compareAtPrice && compareAtPrice > price ? compareAtPrice - price : 0
  const discount = saving && compareAtPrice ? Math.round((saving / compareAtPrice) * 100) : 0

  const onWish = () => {
    toggleWishlist(product)
    setPop(true)
    setTimeout(() => setPop(false), 400)
  }

  const scrollToReviews = () => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const shortDescription = <p className="text-[15px] leading-relaxed text-muted">{l(product.shortDescription)}</p>

  return (
    <div className="flex flex-col">
      <Link to={`/brand/${product.brandId}`} className="eyebrow self-start transition-colors hover:text-rose-dark">
        {product.brandName}
      </Link>
      <h1 className="mt-3 font-serif text-[34px] leading-[1.08] font-medium tracking-[-0.025em] text-balance sm:text-4xl lg:text-[44px]">{product.name}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" onClick={scrollToReviews} className="group inline-flex items-center gap-2" aria-label={t('product.reviewsLink', { count: product.reviewCount })}>
          <RatingStars rating={product.rating} showValue />
          <span className="text-xs text-muted underline-offset-4 group-hover:text-ink group-hover:underline">{t('common.reviewsCount', { count: product.reviewCount.toLocaleString('en-US') })}</span>
        </button>
        <span className="text-xs text-muted">
          {t('product.sku')}:{' '}
          <span dir="ltr" className="font-medium text-ink/80">
            {product.sku}
          </span>
        </span>
      </div>

      {/* Price */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Price price={price} compareAtPrice={compareAtPrice} size="lg" className="text-[28px]" />
        {discount > 0 && <Badge tone="rose">{t('common.off', { value: discount })}</Badge>}
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {t('common.vatIncluded')}
        {saving > 0 && <span className="ms-2 font-medium text-rose">· {t('product.youSave', { amount: formatPrice(saving, lang) })}</span>}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <OriginalBadge size="md" className="border border-line" />
        <AuthorizedBadge size="md" />
      </div>

      <div className="mt-5">
        <StockStatus product={product} />
      </div>

      <div className="mt-6 hidden lg:block">{shortDescription}</div>

      {(product.shades.length > 0 || product.sizes.length > 0) && (
        <div className="mt-7 border-t border-line pt-7">
          <VariantSelector product={product} shadeId={purchase.shadeId} sizeId={purchase.sizeId} onShade={purchase.setShadeId} onSize={purchase.setSizeId} />
        </div>
      )}

      {/* Actions */}
      <div ref={mainButtonRef} className="mt-7 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {!purchase.outOfStock && <QuantitySelector value={purchase.quantity} onChange={purchase.setQuantity} max={purchase.maxQuantity} />}
          <Button size="lg" className="flex-1" disabled={purchase.outOfStock} onClick={purchase.addToCart}>
            {purchase.outOfStock ? t('common.outOfStock') : t('common.addToCart')}
          </Button>
          <button
            type="button"
            onClick={onWish}
            aria-pressed={wished}
            aria-label={wished ? t('common.removeFromWishlist') : t('common.addToWishlist')}
            className="grid size-13 shrink-0 place-items-center rounded-full border border-line bg-white transition-colors hover:border-ink"
          >
            <Heart className={cn('size-5 transition-colors', wished && 'fill-rose text-rose', pop && 'animate-heart-pop')} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {purchase.outOfStock ? (
            <Button size="lg" variant="outline" className="flex-1" icon={<Bell className="size-4" aria-hidden />} onClick={purchase.notifyMe}>
              {t('product.notifyMe')}
            </Button>
          ) : (
            <Button size="lg" variant="dark" className="flex-1" onClick={purchase.buyNow}>
              {t('common.buyNow')}
            </Button>
          )}
          <button
            type="button"
            onClick={() => shareProduct(product, t('product.shareText', { name: product.name }), t('toast.linkCopied'))}
            aria-label={t('product.share')}
            title={t('product.share')}
            className="grid size-13 shrink-0 place-items-center rounded-full border border-line bg-white transition-colors hover:border-ink"
          >
            <Share2 className="size-[18px]" />
          </button>
        </div>
      </div>

      <DeliveryInfo price={price * purchase.quantity} className="mt-8" />

      <div className="mt-6 lg:hidden">{shortDescription}</div>

      <AuthenticityMessage className="mt-6" />
    </div>
  )
}
