import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, SearchX, TrendingUp, X } from 'lucide-react'
import { Button, EmptyState, Reveal, SectionHeading, SmartImage } from '@/components/common'
import { ProductRail } from '@/components/product'
import { categories } from '@/data/categories'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getBestSellingProducts } from '@/services/productService'
import { POPULAR_SEARCHES } from '@/services/searchService'
import { cn } from '@/utils'

/** On-page search form used to refine the query */
export function SearchRefineForm({ query, onSubmit, className }: { query: string; onSubmit: (q: string) => void; className?: string }) {
  const { t } = useT()
  const [value, setValue] = useState(query)
  useEffect(() => setValue(query), [query])
  return (
    <form
      role="search"
      className={cn('flex w-full max-w-2xl gap-2', className)}
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(value.trim())
      }}
    >
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('catalog.search.placeholder')}
          aria-label={t('common.search')}
          className="h-12 w-full rounded-full border border-line bg-white ps-11 pe-11 text-[15px] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-ink/60 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue('')}
            aria-label={t('common.clear')}
            className="absolute end-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-blush hover:text-ink"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <Button type="submit" variant="dark" className="h-12 shrink-0">
        {t('catalog.search.submit')}
      </Button>
    </form>
  )
}

export function PopularSearches({ title, className, center }: { title?: string; className?: string; center?: boolean }) {
  const { t } = useT()
  return (
    <div className={className}>
      <p className={cn('mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase', center && 'justify-center')}>
        <TrendingUp className="size-3.5" aria-hidden />
        {title ?? t('catalog.search.popular')}
      </p>
      <ul className={cn('flex flex-wrap gap-2', center && 'justify-center')}>
        {POPULAR_SEARCHES.map((q) => (
          <li key={q}>
            <Link
              to={`/search?q=${encodeURIComponent(q)}`}
              className="inline-flex h-10 items-center rounded-full border border-line bg-white/70 px-4 text-[13px] font-medium text-ink transition-colors hover:border-ink"
            >
              {q}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Category tiles shown when there is no query yet */
export function SearchCategories() {
  const { t, l } = useT()
  return (
    <section aria-labelledby="search-cats" className="container-x py-16 sm:py-20">
      <SectionHeading as="h2" title={<span id="search-cats">{t('catalog.search.categories')}</span>} />
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
        {categories.map((c, i) => (
          <Reveal as="li" key={c.slug} delay={i * 60}>
            <Link to={`/category/${c.slug}`} className="group block">
              <SmartImage src={c.image} alt={l(c.name)} width={600} height={750} wrapperClassName="aspect-[4/5] rounded-xs" className="transition-transform duration-700 group-hover:scale-105" />
              <span className="mt-3 block font-serif text-xl font-medium tracking-[-0.01em] text-ink">{l(c.name)}</span>
              <span className="mt-0.5 block text-xs text-muted">{c.subcategories.map((s) => l(s.name)).slice(0, 3).join(' · ')}</span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}

export function BestSellersRail() {
  const { t } = useT()
  const { data, loading } = useAsync(() => getBestSellingProducts(10), [])
  return (
    <section aria-labelledby="search-bestsellers" className="bg-mist py-16 sm:py-20">
      <div className="container-x">
        <SectionHeading title={<span id="search-bestsellers">{t('catalog.search.bestSellers')}</span>} />
        <ProductRail products={data} loading={loading} ranked />
      </div>
    </section>
  )
}

/** No-results state: message, popular search chips and a best-sellers rail */
export function SearchNoResults({ query }: { query: string }) {
  const { t } = useT()
  return (
    <>
      <div className="container-x pb-16">
        <EmptyState icon={<SearchX />} title={t('empty.searchTitle', { query })} description={t('empty.searchDesc')} className="pb-8 sm:pb-10" />
        <PopularSearches title={t('catalog.search.tryThese')} center />
      </div>
      <BestSellersRail />
    </>
  )
}
