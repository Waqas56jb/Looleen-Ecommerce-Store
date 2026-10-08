import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Heart, ShoppingBag } from 'lucide-react'
import { Badge, OriginalBadge, Price, RatingStars, SmartImage } from '@/components/common'
import { useShopActions } from '@/hooks/useShop'
import { useT } from '@/i18n'
import { useUIStore } from '@/store/ui'
import { useWishlistStore } from '@/store/wishlist'
import type { Product } from '@/types'
import { cn } from '@/utils'

interface ProductCardProps {
  product: Product
  /** `list` shows a horizontal row (category list view) */
  layout?: 'grid' | 'list'
  priority?: boolean
  className?: string
  /** Optional rank number (best sellers) */
  rank?: number
}

export const ProductCard = memo(function ProductCard({ product, layout = 'grid', priority, className, rank }: ProductCardProps) {
  const { t, l } = useT()
  const { addToCart, toggleWishlist } = useShopActions()
  const wished = useWishlistStore((s) => s.ids.includes(product.id))
  const openQuickView = useUIStore((s) => s.openQuickView)
  const [pop, setPop] = useState(false)
  const href = `/product/${product.slug}`
  const oos = product.stockStatus === 'out_of_stock'
  const needsVariant = product.shades.length > 1 || product.sizes.length > 1

  const onWish = () => {
    toggleWishlist(product)
    setPop(true)
    setTimeout(() => setPop(false), 400)
  }

  const onAdd = () => (needsVariant ? openQuickView(product.slug) : addToCart(product))

  const badges = (
    <div className="pointer-events-none absolute start-3 top-3 z-10 flex flex-col items-start gap-1.5">
      {product.isOnSale && <Badge tone="rose">{t('common.off', { value: product.discountPercentage })}</Badge>}
      {product.isNewArrival && !product.isOnSale && <Badge tone="ink">{t('common.new')}</Badge>}
      {product.professionalProduct && <Badge tone="champagne">{t('common.professional')}</Badge>}
    </div>
  )

  const wishBtn = (
    <button
      type="button"
      onClick={onWish}
      aria-pressed={wished}
      aria-label={wished ? t('common.removeFromWishlist') : t('common.addToWishlist')}
      className="absolute end-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white/90 text-ink shadow-soft backdrop-blur transition-colors hover:bg-white"
    >
      <Heart className={cn('size-4 transition-colors', wished && 'fill-rose text-rose', pop && 'animate-heart-pop')} />
    </button>
  )

  if (layout === 'list') {
    return (
      <article className={cn('group flex gap-5 border-b border-line pb-6 sm:gap-8', className)}>
        <div className="relative w-32 shrink-0 sm:w-48">
          <Link to={href} tabIndex={-1} aria-hidden>
            <SmartImage src={product.thumbnail} alt={product.name} width={400} height={500} wrapperClassName="aspect-[4/5] rounded-xs" className="transition-transform duration-700 group-hover:scale-105" />
          </Link>
          {badges}
        </div>
        <div className="flex min-w-0 flex-1 flex-col py-1">
          <p className="eyebrow text-[10px] text-muted">{product.brandName}</p>
          <h3 className="mt-1.5 font-serif text-xl leading-snug font-medium tracking-[-0.01em] sm:text-2xl">
            <Link to={href} className="hover:text-rose">
              {product.name}
            </Link>
          </h3>
          <RatingStars rating={product.rating} count={product.reviewCount} className="mt-2" />
          <p className="mt-3 line-clamp-2 hidden text-sm leading-relaxed text-muted sm:block">{l(product.shortDescription)}</p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
            <Price price={product.price} compareAtPrice={product.compareAtPrice} />
            <div className="flex items-center gap-2">
              <button type="button" onClick={onWish} aria-pressed={wished} aria-label={wished ? t('common.removeFromWishlist') : t('common.addToWishlist')} className="grid size-10 place-items-center rounded-full border border-line hover:border-ink">
                <Heart className={cn('size-4', wished && 'fill-rose text-rose', pop && 'animate-heart-pop')} />
              </button>
              <button
                type="button"
                onClick={onAdd}
                disabled={oos}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-[13px] font-medium text-ivory transition-colors hover:bg-rose disabled:bg-muted/40"
              >
                <ShoppingBag className="size-4" aria-hidden />
                {oos ? t('common.outOfStock') : t('common.addToCart')}
              </button>
            </div>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className={cn('group relative flex flex-col', className)}>
      <div className="relative overflow-hidden rounded-xs bg-blush/40 transition-shadow duration-500 group-hover:shadow-lift">
        <Link to={href} aria-label={`${product.brandName} ${product.name}`} className="block">
          <SmartImage
            src={product.thumbnail}
            alt={`${product.brandName} ${product.name}`}
            width={600}
            height={750}
            priority={priority}
            wrapperClassName="aspect-[4/5]"
            className="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
          {product.images[1] && (
            <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 max-md:hidden" aria-hidden>
              <SmartImage src={product.images[1]} alt="" width={600} height={750} wrapperClassName="size-full" className="scale-[1.04]" />
            </span>
          )}
          {oos && <span className="absolute inset-0 grid place-items-center bg-ivory/60 text-xs font-semibold tracking-[0.18em] text-ink uppercase">{t('common.outOfStock')}</span>}
        </Link>
        {badges}
        {wishBtn}
        {typeof rank === 'number' && (
          <span className="pointer-events-none absolute bottom-3 start-3 font-serif text-5xl leading-none font-semibold text-white/90 drop-shadow-[0_2px_8px_rgb(0_0_0/0.25)]">{rank}</span>
        )}

        {/* Quick actions — always visible on touch, revealed on hover on desktop */}
        <div className="absolute inset-x-3 bottom-3 z-10 flex gap-2 transition-all duration-300 md:translate-y-3 md:opacity-0 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:translate-y-0 md:group-hover:opacity-100">
          <button
            type="button"
            onClick={onAdd}
            disabled={oos}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-ink/95 text-[12.5px] font-medium text-ivory backdrop-blur transition-colors hover:bg-rose disabled:bg-muted/60 max-md:size-10 max-md:flex-none max-md:ms-auto"
            aria-label={oos ? t('common.outOfStock') : t('common.addToCart')}
          >
            <ShoppingBag className="size-4 shrink-0" aria-hidden />
            <span className="max-md:hidden">{oos ? t('common.outOfStock') : needsVariant ? t('common.quickView') : t('common.addToCart')}</span>
          </button>
          <button
            type="button"
            onClick={() => openQuickView(product.slug)}
            aria-label={t('common.quickView')}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white/95 text-ink backdrop-blur transition-colors hover:bg-white max-md:hidden"
          >
            <Eye className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[10.5px] font-semibold tracking-[0.16em] text-muted uppercase">{product.brandName}</p>
          <OriginalBadge className="max-sm:hidden bg-transparent! px-0! text-[10px]!" />
        </div>
        <h3 className="mt-1.5 line-clamp-2 min-h-[2.6em] text-[14.5px] leading-[1.3] font-medium text-ink">
          <Link to={href} className="transition-colors hover:text-rose">
            {product.name}
          </Link>
        </h3>
        <RatingStars rating={product.rating} count={product.reviewCount} size={12} className="mt-2" />
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
          {product.stockStatus === 'low_stock' && <span className="text-[11px] font-medium text-warning">{t('common.lowStock', { count: product.stock })}</span>}
        </div>
        {product.shades.length > 1 && (
          <div className="mt-2.5 flex items-center gap-1" aria-label={`${product.shades.length} shades`}>
            {product.shades.slice(0, 5).map((s) => (
              <span key={s.id} className="size-3 rounded-full ring-1 ring-black/10" style={{ background: s.hex }} title={s.name} />
            ))}
            {product.shades.length > 5 && <span className="ms-1 text-[11px] text-muted">+{product.shades.length - 5}</span>}
          </div>
        )}
      </div>
    </article>
  )
})
