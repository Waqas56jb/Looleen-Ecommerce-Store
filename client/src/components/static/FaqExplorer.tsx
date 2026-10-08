import { Fragment, useMemo, type ReactNode } from 'react'
import { BadgeCheck, CreditCard, Crown, Package, RotateCcw, Scissors, Search, SearchX, X } from 'lucide-react'
import { AccordionItem, EmptyState } from '@/components/common'
import type { FaqCategory } from '@/i18n/pages/pages'
import { cn } from '@/utils'
import { useStaticCopy } from './copy'

const CATEGORY_ICONS: Record<string, typeof Package> = {
  orders: Package,
  authenticity: BadgeCheck,
  payments: CreditCard,
  returns: RotateCcw,
  account: Crown,
  pro: Scissors,
}

/** Lower-case + fold Arabic letter variants and diacritics so search is forgiving */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim()
}

function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const q = normalize(query)
  if (!q) return text
  const idx = normalize(text).indexOf(q)
  // Only highlight when normalisation kept string length (safe index mapping)
  if (idx < 0 || normalize(text).length !== text.toLowerCase().trim().length) return text
  const start = text.length - text.trimStart().length + idx
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded-xs bg-champagne-soft px-0.5 text-ink">{text.slice(start, start + q.length)}</mark>
      {text.slice(start + q.length)}
    </>
  )
}

export function FaqSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { c } = useStaticCopy()
  const h = c.faq.hero
  return (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="relative mx-auto max-w-xl">
      <label htmlFor="faq-search" className="sr-only">
        {h.searchLabel}
      </label>
      <Search className="pointer-events-none absolute start-5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
      <input
        id="faq-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={h.searchPlaceholder}
        autoComplete="off"
        className="h-14 w-full rounded-full border border-line bg-white ps-13 pe-14 text-[15px] text-ink shadow-soft outline-none transition-colors placeholder:text-muted/70 focus:border-ink focus:ring-2 focus:ring-rose/15 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={h.clearSearch}
          className="absolute end-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:bg-blush hover:text-ink"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </form>
  )
}

interface ResultsProps {
  query: string
  category: string
  onCategory: (id: string) => void
  onClear: () => void
}

export function FaqResults({ query, category, onCategory, onClear }: ResultsProps) {
  const { c, f } = useStaticCopy()
  const categories = c.faq.categories as FaqCategory[]

  const filled = useMemo(
    () => categories.map((cat) => ({ ...cat, items: cat.items.map((it) => ({ q: f(it.q), a: f(it.a) })) })),
    [categories, f],
  )

  const q = normalize(query)
  const results = useMemo(
    () =>
      filled
        .filter((cat) => category === 'all' || cat.id === category)
        .map((cat) => ({ ...cat, items: q ? cat.items.filter((it) => normalize(it.q).includes(q) || normalize(it.a).includes(q)) : cat.items }))
        .filter((cat) => cat.items.length > 0),
    [filled, category, q],
  )
  const total = results.reduce((n, cat) => n + cat.items.length, 0)
  const counts = useMemo(
    () => Object.fromEntries(filled.map((cat) => [cat.id, q ? cat.items.filter((it) => normalize(it.q).includes(q) || normalize(it.a).includes(q)).length : cat.items.length])),
    [filled, q],
  )

  const chips = [{ id: 'all', title: c.faq.all }, ...filled.map(({ id, title }) => ({ id, title }))]

  return (
    <div className="container-x grid grid-cols-1 gap-8 py-10 sm:py-14 lg:grid-cols-12 lg:gap-16 lg:py-20">
      {/* Category chips — horizontal on mobile, vertical sticky list on desktop */}
      <nav aria-label={c.shared.contents} className="lg:col-span-4 xl:col-span-3">
        <div className="sticky top-16 z-20 -mx-4 bg-ivory/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-32 lg:mx-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <p className="eyebrow mb-5 hidden lg:block">{c.shared.contents}</p>
          <ul className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible">
            {chips.map((chip) => {
              const Icon = CATEGORY_ICONS[chip.id]
              const active = category === chip.id
              const count = chip.id === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[chip.id]
              return (
                <li key={chip.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => onCategory(chip.id)}
                    aria-pressed={active}
                    className={cn(
                      'flex min-h-11 w-full items-center gap-2.5 rounded-full border px-4 text-sm whitespace-nowrap transition-colors duration-200 lg:rounded-xs lg:border-0 lg:border-s-2 lg:px-4',
                      active ? 'border-ink bg-ink text-ivory lg:border-rose lg:bg-blush/60 lg:font-medium lg:text-ink' : 'border-line bg-white text-ink hover:border-ink/40 lg:border-line lg:bg-transparent lg:text-muted lg:hover:text-ink',
                    )}
                  >
                    {Icon && <Icon className={cn('size-4 shrink-0', active ? 'text-champagne lg:text-rose' : 'text-rose')} strokeWidth={1.6} aria-hidden />}
                    <span className="lg:flex-1 lg:text-start">{chip.title}</span>
                    <span className={cn('text-xs tabular-nums', active ? 'opacity-70' : 'text-muted')}>{count}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      <div className="min-w-0 lg:col-span-8 xl:col-span-8" aria-live="polite">
        {q && total > 0 && (
          <p className="mb-8 text-sm text-muted">
            {f(c.faq.resultsCount, { count: total, query: query.trim() })}
          </p>
        )}
        {total === 0 ? (
          <EmptyState
            icon={<SearchX className="size-6" />}
            title={c.faq.noResultsTitle}
            description={c.faq.noResultsText}
            action={{ label: c.faq.hero.clearSearch, onClick: onClear }}
          />
        ) : (
          <div className="space-y-14">
            {results.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id] ?? Package
              return (
                <section key={cat.id} aria-labelledby={`faq-${cat.id}`} className="animate-fade-in">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-blush text-rose">
                      <Icon className="size-4.5" strokeWidth={1.6} aria-hidden />
                    </span>
                    <h2 id={`faq-${cat.id}`} className="heading-card">
                      {cat.title}
                    </h2>
                  </div>
                  <div className="border-t border-line">
                    {cat.items.map((it, i) => (
                      <Fragment key={`${cat.id}-${it.q}`}>
                        <AccordionItem title={<Highlight text={it.q} query={query} />} defaultOpen={!!q && i === 0}>
                          <Highlight text={it.a} query={query} />
                        </AccordionItem>
                      </Fragment>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
