import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { EmptyState, ErrorState, Pagination, ProductGridSkeleton, Reveal } from '@/components/common'
import { ChipRow, isCategoryFilter, ListingHero, scrollToId, useCategoryOptions } from '@/components/home/ListingParts'
import { ProductGrid } from '@/components/product'
import { EDITORIAL } from '@/data/images'
import { useAsync, useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { queryProducts } from '@/services/productService'
import type { Product } from '@/types'
import { formatDate } from '@/utils'

const PAGE_SIZE = 24

/** Groups an already date-sorted list by calendar month */
function groupByMonth(items: Product[]) {
  const groups: { key: string; date: string; items: Product[] }[] = []
  for (const p of items) {
    const key = p.createdAt.slice(0, 7)
    const last = groups[groups.length - 1]
    if (last?.key === key) last.items.push(p)
    else groups.push({ key, date: p.createdAt, items: [p] })
  }
  return groups
}

export default function NewArrivalsPage() {
  const { t, lang } = useT()
  useDocumentMeta(t('home.newIn.metaTitle'), t('home.newIn.metaDescription'))
  const [params, setParams] = useSearchParams()

  const rawCategory = params.get('category')
  const category = isCategoryFilter(rawCategory) ? rawCategory : ''
  const page = Math.max(1, Number(params.get('page')) || 1)

  const { data, loading, error, reload } = useAsync(
    () => queryProducts({ sort: 'newest', category: category || undefined, page, pageSize: PAGE_SIZE }),
    [category, page],
  )
  const groups = useMemo(() => groupByMonth(data?.items ?? []), [data])

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
    scrollToId('new-list')
  }
  const categoryOptions = useCategoryOptions(t('home.offers.all'))

  return (
    <>
      <ListingHero image={EDITORIAL.newArrivals} eyebrow={t('home.newIn.eyebrow')} title={t('home.newIn.title')} description={t('home.newIn.description')} crumb={t('nav.newArrivals')} />

      <div className="border-b border-line bg-white">
        <div className="container-x py-3">
          <ChipRow label={t('home.offers.category')} options={categoryOptions} value={category} onChange={setCategory} />
        </div>
      </div>

      <section id="new-list" className="container-x scroll-mt-32 py-14 sm:py-16 lg:py-20" aria-label={t('home.newIn.title')}>
        <p className="mb-8 text-sm text-muted" aria-live="polite">
          {data ? t('home.newIn.count', { count: data.total }) : <span className="skeleton inline-block h-4 w-28 align-middle" />}
        </p>

        {error ? (
          <ErrorState onRetry={reload} />
        ) : loading && !data ? (
          <ProductGridSkeleton count={8} />
        ) : !groups.length ? (
          <EmptyState icon={<Sparkles />} title={t('home.newIn.emptyTitle')} description={t('home.newIn.emptyDesc')} action={category ? { label: t('home.offers.all'), onClick: () => setCategory('') } : undefined} />
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : undefined}>
            {groups.map((g, gi) => {
              const month = formatDate(g.date, lang, { month: 'long', year: 'numeric' })
              const fresh = gi === 0 && data?.page === 1
              return (
                <div key={g.key} className="mb-16 last:mb-0 sm:mb-20">
                  <Reveal className="mb-8 flex items-baseline gap-4">
                    <h2 className="font-serif text-2xl font-medium tracking-[-0.015em] sm:text-3xl">{fresh ? t('home.newIn.justLanded') : month}</h2>
                    {fresh && <span className="eyebrow">{month}</span>}
                    <span className="h-px flex-1 bg-line" aria-hidden />
                  </Reveal>
                  <ProductGrid products={g.items} />
                </div>
              )
            })}
            {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} className="mt-14" />}
          </div>
        )}
      </section>
    </>
  )
}
