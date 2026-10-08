import { useSearchParams } from 'react-router-dom'
import { Percent } from 'lucide-react'
import { EmptyState, ErrorState, Reveal, SectionHeading, Skeleton, TrustBar } from '@/components/common'
import { ChipRow, isCategoryFilter, ListingHero, useCategoryOptions, type ChipOption } from '@/components/home/ListingParts'
import { OfferCard } from '@/components/home/OfferCard'
import { ProductGrid } from '@/components/product'
import { EDITORIAL } from '@/data/images'
import { useAsync, useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { getOffers } from '@/services/catalogService'
import { queryProducts } from '@/services/productService'
import { cn } from '@/utils'

const DISCOUNTS = [0, 10, 20, 30, 50] as const

function OffersShowcase() {
  const { t } = useT()
  const { data, loading, error, reload } = useAsync(() => getOffers(), [])
  if (error) return <ErrorState onRetry={reload} />
  if (!loading && !data?.length) return null
  return (
    <section className="container-x py-16 sm:py-20 lg:py-24" aria-labelledby="offers-current">
      <Reveal>
        <SectionHeading eyebrow={t('home.offers.offersEyebrow')} title={<span id="offers-current">{t('home.offers.offersTitle')}</span>} />
      </Reveal>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {loading || !data
          ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className={cn('h-[520px]', i === 0 && 'md:col-span-2 lg:col-span-3 lg:h-[420px]')} />)
          : data.map((offer, i) => (
              <Reveal key={offer.id} delay={i * 80} className={cn(i === 0 && 'md:col-span-2 lg:col-span-3')}>
                <OfferCard offer={offer} featured={i === 0} />
              </Reveal>
            ))}
      </div>
    </section>
  )
}

export default function OffersPage() {
  const { t } = useT()
  useDocumentMeta(t('home.offers.metaTitle'), t('home.offers.metaDescription'))
  const [params, setParams] = useSearchParams()

  const rawCategory = params.get('category')
  const category = isCategoryFilter(rawCategory) ? rawCategory : ''
  const rawMin = Number(params.get('min'))
  const minDiscount = (DISCOUNTS as readonly number[]).includes(rawMin) ? rawMin : 0

  const { data, loading, error, reload } = useAsync(
    () => queryProducts({ onSaleOnly: true, minDiscount: minDiscount || undefined, category: category || undefined, sort: 'discount', pageSize: 48 }),
    [category, minDiscount],
  )

  const update = (key: 'category' | 'min', value: string | number) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, String(value))
    else next.delete(key)
    setParams(next, { replace: true, preventScrollReset: true })
  }

  const discountOptions: ChipOption<number>[] = DISCOUNTS.map((d) => ({ value: d, label: d ? t('home.offers.minDiscount', { value: d }) : t('home.offers.all') }))
  const categoryOptions = useCategoryOptions(t('home.offers.allCategories'))
  const filtered = !!category || !!minDiscount

  return (
    <>
      <ListingHero image={EDITORIAL.offers} eyebrow={t('home.offers.eyebrow')} title={t('home.offers.title')} description={t('home.offers.description')} crumb={t('nav.offers')} />
      <TrustBar variant="strip" className="bg-white" />

      <OffersShowcase />

      <section className="border-t border-line bg-mist py-16 sm:py-20 lg:py-24" aria-labelledby="offers-products">
        <div className="container-x">
          <Reveal>
            <SectionHeading eyebrow={t('home.offers.productsEyebrow')} title={<span id="offers-products">{t('home.offers.productsTitle')}</span>} />
          </Reveal>

          <div className="mb-10 flex flex-col gap-3 border-y border-line py-4 sm:gap-4">
            <ChipRow label={t('home.offers.discount')} options={discountOptions} value={minDiscount} onChange={(v) => update('min', v)} />
            <ChipRow label={t('home.offers.category')} options={categoryOptions} value={category} onChange={(v) => update('category', v)} />
          </div>

          <p className="mb-6 text-sm text-muted" aria-live="polite">
            {loading && !data ? <span className="inline-block h-4 w-24 align-middle skeleton" /> : t('home.offers.count', { count: data?.total ?? 0 })}
          </p>

          {error ? (
            <ErrorState onRetry={reload} />
          ) : (
            <ProductGrid
              products={data?.items}
              loading={loading}
              empty={
                <EmptyState
                  icon={<Percent />}
                  title={t('home.offers.emptyTitle')}
                  description={t('home.offers.emptyDesc')}
                  action={filtered ? { label: t('home.offers.reset'), onClick: () => setParams(new URLSearchParams(), { replace: true, preventScrollReset: true }) } : undefined}
                />
              }
            />
          )}
        </div>
      </section>
    </>
  )
}
