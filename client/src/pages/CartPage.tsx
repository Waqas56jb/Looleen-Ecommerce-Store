import { ShoppingBag } from 'lucide-react'
import { ArrowLink, Breadcrumbs, EmptyState, ErrorState, SectionHeading } from '@/components/common'
import { CartLineItem } from '@/components/cart/CartLineItem'
import { FreeShippingMeter } from '@/components/cart/CartDrawer'
import { CartStickyBar, CartSummary } from '@/components/cart/CartSummary'
import { ProductRail } from '@/components/product'
import { useAsync, useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { getBestSellingProducts } from '@/services/productService'
import { useCartStore, useCartTotals } from '@/store/cart'

function EmptyCart() {
  const { t } = useT()
  const { data, loading, error, reload } = useAsync(() => getBestSellingProducts(8), [])
  return (
    <>
      <EmptyState
        icon={<ShoppingBag />}
        title={t('empty.cartTitle')}
        description={t('empty.cartDesc')}
        action={{ label: t('common.shopNow'), to: '/best-sellers' }}
        className="py-16 sm:py-20"
      />
      <section className="border-t border-line py-16 sm:py-20" aria-labelledby="empty-rail">
        <SectionHeading
          eyebrow={t('cart.emptyRailEyebrow')}
          title={<span id="empty-rail">{t('cart.emptyRailTitle')}</span>}
          action={<ArrowLink to="/best-sellers">{t('common.viewAll')}</ArrowLink>}
          className="mb-8 sm:mb-10"
        />
        {error ? <ErrorState onRetry={reload} /> : <ProductRail products={data} loading={loading} />}
      </section>
    </>
  )
}

export default function CartPage() {
  const { t } = useT()
  useDocumentMeta(t('cart.metaTitle'), t('cart.metaDesc'))
  const items = useCartStore((s) => s.items)
  const totals = useCartTotals()

  return (
    <div className="container-x pt-6 pb-28 sm:pt-8 lg:pb-28">
      <Breadcrumbs items={[{ label: t('cart.title') }]} />

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6 sm:mt-10">
        <div>
          <p className="eyebrow">{t('cart.eyebrow')}</p>
          <h1 className="heading-page mt-2">
            {t('cart.title')}
            {items.length > 0 && (
              <span className="ms-3 align-middle font-sans text-base font-normal tracking-normal text-muted sm:text-lg">
                ({totals.itemCount === 1 ? t('cart.itemCountOne') : t('cart.itemCount', { count: totals.itemCount })})
              </span>
            )}
          </h1>
        </div>
        {items.length > 0 && <ArrowLink to="/best-sellers">{t('cart.continueShopping')}</ArrowLink>}
      </header>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_440px]">
            <section aria-label={t('cart.title')}>
              <FreeShippingMeter />
              <ul className="mt-2 divide-y divide-line border-b border-line">
                {items.map((item) => (
                  <CartLineItem key={item.key} item={item} />
                ))}
              </ul>
            </section>
            <CartSummary />
          </div>
          <CartStickyBar />
        </>
      )}
    </div>
  )
}
