import { Link } from 'react-router-dom'
import { ShieldCheck, ShoppingBag, Timer } from 'lucide-react'
import { ArrowLink, Badge, Button, Countdown, RatingStars, Reveal, SectionHeading, Skeleton, SmartImage, Money } from '@/components/common'
import { ProductRail } from '@/components/product'
import { useAsync } from '@/hooks'
import { useShopActions } from '@/hooks/useShop'
import { useT } from '@/i18n'
import { getFlashDealEnd } from '@/services/catalogService'
import { getBestSellingProducts, getOnSaleProducts, getProductsByIds, getTrendingProducts } from '@/services/productService'
import { useUIStore } from '@/store/ui'
import { useRecentlyViewedStore } from '@/store/wishlist'
import type { Product } from '@/types'

/* ---------------- Flash deals ---------------- */

export function FlashDeals() {
  const { t } = useT()
  const end = useAsync(() => getFlashDealEnd(), [])
  const deals = useAsync(() => getOnSaleProducts(8), [])
  if (!deals.loading && !deals.data?.length) return null

  return (
    <section className="bg-blush py-16 sm:py-20 lg:py-28" aria-labelledby="home-flash">
      <div className="container-x">
        <Reveal className="mb-10 grid grid-cols-1 gap-8 lg:mb-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-3 flex items-center gap-2">
              <Timer className="size-3.5" aria-hidden />
              {t('home.flash.eyebrow')}
            </p>
            <h2 id="home-flash" className="heading-section text-balance">
              {t('home.flash.title')}
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">{t('home.flash.description')}</p>
          </div>
          <div className="flex flex-col gap-4 lg:col-span-5 lg:items-end">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold tracking-[0.18em] text-ink/70 uppercase">{t('home.flash.endsIn')}</span>
              {end.loading ? <Skeleton className="h-14 w-60" /> : <Countdown to={end.data} onExpiredLabel={t('home.flash.ended')} />}
            </div>
            <ArrowLink to="/offers">{t('home.flash.viewAll')}</ArrowLink>
          </div>
        </Reveal>
        <ProductRail products={deals.data} loading={deals.loading} />
      </div>
    </section>
  )
}

/* ---------------- Best sellers ---------------- */

export function BestSellersRail() {
  const { t } = useT()
  const { data, loading } = useAsync(() => getBestSellingProducts(10), [])
  if (!loading && !data?.length) return null
  return (
    <section className="container-x py-16 sm:py-20 lg:py-28" aria-labelledby="home-best">
      <Reveal>
        <SectionHeading
          eyebrow={t('home.bestSellers.eyebrow')}
          title={<span id="home-best">{t('home.bestSellers.title')}</span>}
          description={t('home.bestSellers.description')}
          action={<ArrowLink to="/best-sellers">{t('home.bestSellers.viewAll')}</ArrowLink>}
        />
      </Reveal>
      <ProductRail products={data} loading={loading} ranked />
    </section>
  )
}

/* ---------------- Trending ---------------- */

/** Large editorial product feature for dark backgrounds */
function FeaturedProduct({ product }: { product: Product }) {
  const { t, l } = useT()
  const { addToCart } = useShopActions()
  const openQuickView = useUIStore((s) => s.openQuickView)
  const needsVariant = product.shades.length > 1 || product.sizes.length > 1
  const oos = product.stockStatus === 'out_of_stock'
  const href = `/product/${product.slug}`
  return (
    <article className="group grid grid-cols-1 gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-end sm:gap-8">
      <Link to={href} className="relative block overflow-hidden rounded-xs" tabIndex={-1} aria-hidden>
        <SmartImage src={product.images[0] ?? product.thumbnail} alt={product.name} width={800} height={1000} wrapperClassName="aspect-[4/5]" className="transition-transform duration-700 group-hover:scale-105" />
        <span className="absolute start-3 top-3 flex flex-col items-start gap-1.5">
          <Badge tone="champagne">{t('home.trending.featured')}</Badge>
          {product.isOnSale && <Badge tone="rose">{t('common.off', { value: product.discountPercentage })}</Badge>}
        </span>
      </Link>
      <div className="pb-1">
        <p className="eyebrow text-champagne">{product.brandName}</p>
        <h3 className="mt-3 font-serif text-3xl leading-tight font-medium text-ivory sm:text-4xl">
          <Link to={href} className="transition-colors hover:text-rose-soft">
            {product.name}
          </Link>
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ivory/65">{l(product.shortDescription)}</p>
        <RatingStars rating={product.rating} className="mt-4 [&_.text-ink]:text-ivory [&_.text-muted]:text-ivory/60" count={product.reviewCount} />
        <p className="mt-4 flex items-baseline gap-2">
          <span className="text-xl font-semibold text-ivory tabular-nums"><Money value={product.price} /></span>
          {product.compareAtPrice && product.compareAtPrice > product.price && <s className="text-sm text-ivory/50 tabular-nums"><Money value={product.compareAtPrice} /></s>}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="light" icon={<ShoppingBag className="size-4" />} disabled={oos} onClick={() => (needsVariant ? openQuickView(product.slug) : addToCart(product))}>
            {oos ? t('common.outOfStock') : t('common.addToCart')}
          </Button>
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/20 px-3 text-xs font-semibold text-ivory/90">
            <ShieldCheck className="size-4 text-champagne" aria-hidden />
            {t('common.original')}
          </span>
        </div>
      </div>
    </article>
  )
}

export function TrendingSection() {
  const { t } = useT()
  const { data, loading } = useAsync(() => getTrendingProducts(8), [])
  if (!loading && !data?.length) return null
  const [first, ...rest] = data ?? []

  return (
    <section aria-labelledby="home-trending">
      <div className="bg-ink py-16 text-ivory sm:py-20 lg:py-24">
        <div className="container-x grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow text-champagne">{t('home.trending.eyebrow')}</p>
            <h2 id="home-trending" className="heading-section mt-3 text-balance text-ivory">
              {t('home.trending.title')}
            </h2>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ivory/65">{t('home.trending.description')}</p>
            <ArrowLink to="/best-sellers" tone="light" className="mt-8">
              {t('home.bestSellers.viewAll')}
            </ArrowLink>
          </Reveal>
          <Reveal className="lg:col-span-8" delay={120}>
            {loading || !first ? (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <Skeleton className="aspect-[4/5] w-full opacity-20" />
                <div className="space-y-4 self-end">
                  <Skeleton className="h-3 w-24 opacity-20" />
                  <Skeleton className="h-10 w-4/5 opacity-20" />
                  <Skeleton className="h-16 w-full opacity-20" />
                </div>
              </div>
            ) : (
              <FeaturedProduct product={first} />
            )}
          </Reveal>
        </div>
      </div>
      {(loading || rest.length > 0) && (
        <div className="container-x pt-12 pb-16 sm:pt-14 sm:pb-20 lg:pb-28">
          <ProductRail products={loading ? undefined : rest} loading={loading} />
        </div>
      )}
    </section>
  )
}

/* ---------------- Recently viewed ---------------- */

export function RecentlyViewedRail() {
  const { t } = useT()
  const ids = useRecentlyViewedStore((s) => s.ids)
  const key = ids.join(',')
  const { data, loading } = useAsync(() => (ids.length ? getProductsByIds(ids) : Promise.resolve([])), [key])
  if (!ids.length || (!loading && !data?.length)) return null
  return (
    <section className="container-x py-16 sm:py-20 lg:py-24" aria-labelledby="home-recent">
      <Reveal>
        <SectionHeading eyebrow={t('home.recent.eyebrow')} title={<span id="home-recent">{t('common.recentlyViewed')}</span>} />
      </Reveal>
      <ProductRail products={data} loading={loading} />
    </section>
  )
}
