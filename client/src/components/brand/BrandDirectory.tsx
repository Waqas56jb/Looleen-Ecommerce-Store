import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Search, SearchX, X } from 'lucide-react'
import { EmptyState, Reveal, SmartImage } from '@/components/common'
import { useT } from '@/i18n'
import type { BrandWithCount } from '@/services/catalogService'
import { cn } from '@/utils'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/** First Latin letter of a brand name (diacritics stripped); digits/others → "#" */
function letterOf(name: string): string {
  const c = name.normalize('NFD').replace(/[̀-ͯ]/g, '').charAt(0).toUpperCase()
  return LETTERS.includes(c) ? c : '#'
}

/** Image card with the brand name over an ink overlay */
export function FeaturedBrandCard({ brand, priority }: { brand: BrandWithCount; priority?: boolean }) {
  const { t, lang } = useT()
  return (
    <Link to={`/brand/${brand.slug}`} className="group relative block overflow-hidden rounded-xs">
      <SmartImage
        src={brand.image}
        alt={brand.name}
        width={700}
        height={875}
        priority={priority}
        wrapperClassName="aspect-[4/5]"
        className="transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" aria-hidden />
      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-ivory sm:p-5">
        <span className="min-w-0">
          <span className="block font-serif text-xl leading-tight font-medium tracking-[-0.01em] sm:text-2xl">
            {brand.name}
          </span>
          {lang === 'ar' && <span className="mt-0.5 block text-xs text-ivory/75">{brand.nameAr}</span>}
          <span className="mt-1 block text-[11px] tracking-[0.14em] text-ivory/70 uppercase">{t('catalog.brands.products', { count: brand.productCount })}</span>
        </span>
        <ArrowUpRight className="size-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 rtl:-scale-x-100" aria-hidden />
      </span>
    </Link>
  )
}

/** Search + sticky A–Z index + brands grouped by first letter */
export function BrandDirectory({ brands }: { brands: BrandWithCount[] }) {
  const { t, lang } = useT()
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q ? brands.filter((b) => b.name.toLowerCase().includes(q) || b.nameAr.includes(query.trim()) || b.slug.includes(q)) : brands
    const map = new Map<string, BrandWithCount[]>()
    ;[...filtered]
      .sort((a, b) => a.name.localeCompare(b.name, 'en'))
      .forEach((b) => {
        const k = letterOf(b.name)
        map.set(k, [...(map.get(k) ?? []), b])
      })
    return [...map.entries()].sort(([a], [b]) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)))
  }, [brands, query])

  const available = new Set(groups.map(([k]) => k))

  const jump = (letter: string) => {
    document.getElementById(`brands-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section aria-labelledby="all-brands" className="pb-20 sm:pb-28">
      <div className="container-x flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="all-brands" className="heading-section">
            {t('catalog.brands.all')}
          </h2>
          <p className="mt-2 text-sm text-muted">{t('catalog.brands.count', { count: brands.length })}</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('catalog.brands.searchPlaceholder')}
            aria-label={t('catalog.brands.searchLabel')}
            className="h-12 w-full rounded-full border border-line bg-white/80 ps-11 pe-11 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-ink/60 focus:bg-white [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('catalog.brands.clearSearch')}
              className="absolute end-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-blush hover:text-ink"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sticky A–Z index (Latin in both languages — brand names are Latin) */}
      <nav aria-label={t('catalog.brands.index')} className="sticky top-16 z-30 mt-8 border-y border-line bg-ivory/90 backdrop-blur lg:top-28">
        <ul className="container-x no-scrollbar flex gap-0.5 overflow-x-auto py-2 lg:justify-between" dir="ltr">
          {[...LETTERS, '#'].map((letter) => {
            const on = available.has(letter)
            return (
              <li key={letter} className="shrink-0">
                <button
                  type="button"
                  disabled={!on}
                  onClick={() => jump(letter)}
                  aria-label={t('catalog.brands.jumpTo', { letter })}
                  className={cn(
                    'grid size-10 place-items-center rounded-full text-[13px] font-semibold transition-colors lg:size-9',
                    on ? 'text-ink hover:bg-ink hover:text-ivory' : 'cursor-default text-muted/35',
                  )}
                >
                  {letter}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="container-x">
        {!groups.length ? (
          <EmptyState
            icon={<SearchX />}
            title={t('catalog.brands.noMatchTitle', { query: query.trim() })}
            description={t('catalog.brands.noMatchDesc')}
            action={{ label: t('catalog.brands.clearSearch'), onClick: () => setQuery('') }}
          />
        ) : (
          groups.map(([letter, list]) => (
            <Reveal key={letter} as="section" className="grid grid-cols-1 scroll-mt-32 gap-4 border-b border-line py-10 sm:grid-cols-[100px_minmax(0,1fr)] lg:scroll-mt-44 lg:grid-cols-[160px_minmax(0,1fr)]">
              <h3 id={`brands-${letter}`} className="scroll-mt-32 font-serif text-5xl leading-none font-medium text-rose lg:scroll-mt-44 lg:text-6xl">
                {letter}
              </h3>
              <ul className="grid grid-cols-1 gap-x-8 gap-y-1 min-[480px]:grid-cols-2 lg:grid-cols-3">
                {list.map((b) => (
                  <li key={b.id}>
                    <Link to={`/brand/${b.slug}`} className="group flex min-h-14 items-center justify-between gap-3 border-b border-line/60 py-3">
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-medium text-ink transition-colors group-hover:text-rose">
                          {b.name}
                        </span>
                        {lang === 'ar' && <span className="block truncate text-xs text-muted">{b.nameAr}</span>}
                      </span>
                      <span className="shrink-0 text-xs text-muted tabular-nums">{t('catalog.brands.products', { count: b.productCount })}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))
        )}
      </div>
    </section>
  )
}
