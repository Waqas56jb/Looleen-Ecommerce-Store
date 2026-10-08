import { Link } from 'react-router-dom'
import { Award, ShoppingBag } from 'lucide-react'
import { Badge, Button, Price, RatingStars, SmartImage } from '@/components/common'
import { ProductCard } from '@/components/product'
import { useShopActions } from '@/hooks/useShop'
import { useT } from '@/i18n'
import { useUIStore } from '@/store/ui'
import type { Product } from '@/types'
import { cn } from '@/utils'

/** Rounds sales to a friendly "1,200+" style figure */
function roundSales(n: number) {
  if (n >= 1000) return Math.floor(n / 100) * 100
  if (n >= 100) return Math.floor(n / 10) * 10
  return n
}

export function PodiumCard({ product, rank }: { product: Product; rank: number }) {
  const { t, lang } = useT()
  const { addToCart } = useShopActions()
  const openQuickView = useUIStore((s) => s.openQuickView)
  const needsVariant = product.shades.length > 1 || product.sizes.length > 1
  const oos = product.stockStatus === 'out_of_stock'
  const href = `/product/${product.slug}`
  const first = rank === 1
  return (
    <article className={cn('group relative flex h-full flex-col rounded-xs border bg-white p-4 sm:p-5', first ? 'border-champagne/60 shadow-lift' : 'border-line')}>
      <Link to={href} tabIndex={-1} aria-hidden className="relative block overflow-hidden rounded-xs">
        <SmartImage src={product.thumbnail} alt={product.name} width={700} height={820} wrapperClassName="aspect-[6/7]" className="transition-transform duration-700 group-hover:scale-105" />
        {product.isOnSale && (
          <span className="absolute start-3 top-3">
            <Badge tone="rose">{t('common.off', { value: product.discountPercentage })}</Badge>
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col pt-5">
        <div className="flex items-center justify-between gap-3">
          <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase', first ? 'text-[#8a6a32]' : 'text-muted')}>
            <Award className="size-4" aria-hidden />
            {t('home.best.rank', { rank })}
          </span>
          <span className="text-xs text-muted tabular-nums">{t('home.best.sold', { count: roundSales(product.salesCount).toLocaleString(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US') })}</span>
        </div>
        <p className="mt-4 text-[10px] font-semibold tracking-[0.22em] text-muted uppercase">{product.brandName}</p>
        <h3 className="mt-1.5 font-serif text-xl leading-snug font-medium sm:text-2xl">
          <Link to={href} className="transition-colors hover:text-rose">
            {product.name}
          </Link>
        </h3>
        <RatingStars rating={product.rating} count={product.reviewCount} className="mt-2.5" />
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
          <Button size="sm" variant={first ? 'primary' : 'dark'} disabled={oos} icon={<ShoppingBag className="size-3.5" />} onClick={() => (needsVariant ? openQuickView(product.slug) : addToCart(product))}>
            {oos ? t('common.outOfStock') : t('common.addToCart')}
          </Button>
        </div>
      </div>
      <span
        className={cn('pointer-events-none absolute -top-5 end-5 font-serif text-6xl leading-none font-semibold sm:-top-7 sm:text-7xl', first ? 'text-champagne' : 'text-ink/15')}
        aria-hidden
      >
        {rank}
      </span>
    </article>
  )
}

/** Same grid rhythm as ProductGrid, with rank numbers on every card */
export function RankedGrid({ products, offset = 0, loading }: { products: Product[]; offset?: number; loading?: boolean }) {
  return (
    <div className={cn('grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4', loading && 'opacity-60 transition-opacity')}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} rank={offset + i + 1} priority={i < 4} />
      ))}
    </div>
  )
}
