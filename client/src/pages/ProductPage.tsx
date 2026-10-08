import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PackageSearch } from 'lucide-react'
import { toast } from 'sonner'
import { Breadcrumbs, EmptyState, ErrorState, ProductPageSkeleton, Reveal, SectionHeading } from '@/components/common'
import { ProductRail } from '@/components/product'
import { ImageGallery } from '@/components/product/ImageGallery'
import { ProductInfo, type PurchaseState } from '@/components/product/ProductInfo'
import { ProductTabs } from '@/components/product/ProductTabs'
import { StickyAddToCart } from '@/components/product/StickyAddToCart'
import { ReviewsSection } from '@/components/reviews/ReviewsSection'
import { findCategory } from '@/data/categories'
import { useAsync, useDocumentMeta } from '@/hooks'
import { useShopActions } from '@/hooks/useShop'
import { useT } from '@/i18n'
import { getProductBySlug, getProductsByIds, getRelatedProducts } from '@/services/productService'
import { useRecentlyViewedStore } from '@/store/wishlist'
import type { Product } from '@/types'
import { unitPrice } from '@/utils/catalog'

/** Variant / quantity state plus cart actions shared by the buy box and sticky bar */
function usePurchase(product: Product): PurchaseState {
  const { t } = useT()
  const navigate = useNavigate()
  const { addToCart } = useShopActions()
  const [shadeId, setShadeId] = useState(product.shades[0]?.id)
  const [sizeId, setSizeId] = useState(product.sizes[0]?.id)
  const [quantity, setQuantity] = useState(1)
  const outOfStock = product.stockStatus === 'out_of_stock'
  const maxQuantity = Math.max(1, Math.min(product.stock, 10))

  const add = useCallback(() => addToCart(product, { quantity, shadeId, sizeId }), [addToCart, product, quantity, shadeId, sizeId])

  return {
    shadeId,
    sizeId,
    quantity,
    setShadeId,
    setSizeId,
    setQuantity,
    price: unitPrice(product, sizeId),
    outOfStock,
    maxQuantity,
    addToCart: () => void add(),
    buyNow: () => {
      if (add()) navigate('/checkout')
    },
    notifyMe: () => toast.success(t('toast.notifyMe'), { description: product.name }),
  }
}

function RecentlyViewed({ currentId }: { currentId: string }) {
  const { t } = useT()
  const ids = useRecentlyViewedStore((s) => s.ids)
  const others = useMemo(() => ids.filter((id) => id !== currentId), [ids, currentId])
  const key = others.join(',')
  const { data, loading } = useAsync(() => (others.length ? getProductsByIds(others) : Promise.resolve([])), [key])
  if (!others.length || (!loading && !data?.length)) return null
  return (
    <section className="border-t border-line py-16 sm:py-20" aria-labelledby="recent-heading">
      <div className="container-x">
        <SectionHeading eyebrow={t('product.related.recentEyebrow')} title={<span id="recent-heading">{t('common.recentlyViewed')}</span>} />
        <ProductRail products={data} loading={loading} />
      </div>
    </section>
  )
}

function ProductView({ product }: { product: Product }) {
  const { t, l } = useT()
  const purchase = usePurchase(product)
  const buyBoxRef = useRef<HTMLDivElement>(null)
  const related = useAsync(() => getRelatedProducts(product), [product.id])
  const pushRecent = useRecentlyViewedStore((s) => s.push)

  useEffect(() => {
    pushRecent(product.id)
  }, [product.id, pushRecent])

  const crumbs = useMemo(() => {
    const items: { label: string; to?: string }[] = []
    const cat = findCategory(product.category)
    const sub = findCategory(product.subcategory)
    if (cat) items.push({ label: l(cat.category.name), to: `/category/${cat.category.slug}` })
    if (sub?.kind === 'subcategory') items.push({ label: l(sub.sub.name), to: `/category/${sub.sub.slug}` })
    items.push({ label: product.name })
    return items
  }, [product, l])

  return (
    <div className="pb-28 lg:pb-0">
      <div className="container-x pt-5 lg:pt-8">
        <Breadcrumbs items={crumbs} className="mb-5 lg:mb-8" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] lg:gap-14 xl:gap-20">
          <ImageGallery product={product} />
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ProductInfo product={product} purchase={purchase} mainButtonRef={buyBoxRef} />
          </div>
        </div>
      </div>

      <section className="container-x py-16 sm:py-20" aria-label={t('product.tabs.description')}>
        <ProductTabs product={product} />
      </section>

      <div className="bg-mist">
        <div className="container-x py-16 sm:py-20 lg:py-24">
          <ReviewsSection product={product} />
        </div>
      </div>

      {(related.loading || !!related.data?.length) && (
        <Reveal as="section" className="py-16 sm:py-20 lg:py-24">
          <div className="container-x">
            <SectionHeading eyebrow={t('product.related.eyebrow')} title={t('common.youMayAlsoLike')} />
            <ProductRail products={related.data} loading={related.loading} />
          </div>
        </Reveal>
      )}

      <RecentlyViewed currentId={product.id} />

      <StickyAddToCart product={product} purchase={purchase} targetRef={buyBoxRef} />
    </div>
  )
}

export default function ProductPage() {
  const { slug = '' } = useParams()
  const { t, l } = useT()
  const { data: product, loading, error, reload } = useAsync(() => getProductBySlug(slug), [slug])

  useDocumentMeta(product ? product.name : loading ? undefined : t('product.notFoundTitle'), product ? l(product.shortDescription) : undefined)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [slug])

  if (error) return <ErrorState onRetry={reload} className="container-x" />
  if (loading && product?.slug !== slug) return <ProductPageSkeleton />
  if (!product)
    return (
      <div className="container-x">
        <EmptyState icon={<PackageSearch />} title={t('product.notFoundTitle')} description={t('product.notFoundDesc')} action={{ label: t('product.notFoundCta'), to: '/new-arrivals' }} />
      </div>
    )
  // key resets variant/quantity state when navigating between products
  return <ProductView key={product.id} product={product} />
}
