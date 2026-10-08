import { useSearchParams } from 'react-router-dom'
import { Award } from 'lucide-react'
import { EmptyState, ErrorState, Pagination, ProductGridSkeleton, Reveal, SectionHeading, Skeleton } from '@/components/common'
import { ChipRow, isCategoryFilter, ListingHero, scrollToId, useCategoryOptions } from '@/components/home/ListingParts'
import { PodiumCard, RankedGrid } from '@/components/home/RankedParts'
import { EDITORIAL } from '@/data/images'
import { useAsync, useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { queryProducts } from '@/services/productService'
import { cn } from '@/utils'

const PAGE_SIZE = 24

export default function BestSellersPage() {
  const { t } = useT()
  useDocumentMeta(t('home.best.metaTitle'), t('home.best.metaDescription'))
  const [params, setParams] = useSearchParams()

  const rawCategory = params.get('category')
  const category = isCategoryFilter(rawCategory) ? rawCategory : ''
  const page = Math.max(1, Number(params.get('page')) || 1)

  const podium = useAsync(() => queryProducts({ sort: 'best-selling', category: category || undefined, pageSize: 3 }), [category])
  const list = useAsync(() => queryProducts({ sort: 'best-selling', category: category || undefined, page, pageSize: PAGE_SIZE }), [category, page])

  const setCategory = (v: string) => {
    const next = new URLSearchParams()
    if (v) next.set('category', v)
    setParams(next, { replace: true, preventScrollReset: true })
  }
  const setPage = (p: number) => {
    const next = new URLSearchParams(params)
    if (p > 1) next.set('page', String(p))
    else next.delete('page')
    setParams(next, { preventScrollReset: true })
    scrollToId('best-ranking')
  }

  const categoryOptions = useCategoryOptions(t('home.offers.all'))
  const top = podium.data?.items ?? []
  const data = list.data

  return (
    <>
      <ListingHero image={EDITORIAL.bestSellers} eyebrow={t('home.best.eyebrow')} title={t('home.best.title')} description={t('home.best.description')} crumb={t('nav.bestSellers')} />

      <div className="border-b border-line bg-white">
        <div className="container-x py-3">
          <ChipRow label={t('home.offers.category')} options={categoryOptions} value={category} onChange={setCategory} />
        </div>
      </div>

      {/* Podium */}
      {(podium.loading || top.length > 0) && (
        <section className="container-x pt-16 sm:pt-20 lg:pt-24" aria-labelledby="best-podium">
          <Reveal>
            <SectionHeading align="center" eyebrow={t('home.best.podiumEyebrow')} title={<span id="best-podium">{t('home.best.podiumTitle')}</span>} />
          </Reveal>
          <ol className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-8 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:items-end lg:gap-8">
            {podium.loading && !top.length
              ? Array.from({ length: 3 }, (_, i) => (
                  <li key={i} className="w-[78%] shrink-0 sm:w-auto">
                    <Skeleton className="h-[560px]" />
                  </li>
                ))
              : top.map((p, i) => (
                  <Reveal
                    as="li"
                    key={p.id}
                    delay={i * 100}
                    className={cn('w-[78%] shrink-0 snap-start sm:w-auto', i === 0 && 'sm:order-2 lg:-translate-y-6', i === 1 && 'sm:order-1', i === 2 && 'sm:order-3')}
                  >
                    <PodiumCard product={p} rank={i + 1} />
                  </Reveal>
                ))}
          </ol>
        </section>
      )}

      {/* Full ranking */}
      <section id="best-ranking" className="container-x scroll-mt-32 py-16 sm:py-20 lg:py-24" aria-labelledby="best-ranking-title">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5 sm:mb-10">
          <h2 id="best-ranking-title" className="heading-section">
            {t('home.best.rankingTitle')}
          </h2>
          <p className="text-sm text-muted" aria-live="polite">
            {data ? t('home.best.count', { count: data.total }) : <span className="skeleton inline-block h-4 w-24 align-middle" />}
          </p>
        </div>

        {list.error ? (
          <ErrorState onRetry={list.reload} />
        ) : list.loading && !data ? (
          <ProductGridSkeleton count={8} />
        ) : !data?.items.length ? (
          <EmptyState icon={<Award />} title={t('home.best.emptyTitle')} description={t('home.best.emptyDesc')} action={category ? { label: t('home.offers.all'), onClick: () => setCategory('') } : undefined} />
        ) : (
          <>
            <RankedGrid products={data.items} offset={(data.page - 1) * data.pageSize} loading={list.loading} />
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} className="mt-14" />
          </>
        )}
      </section>
    </>
  )
}
