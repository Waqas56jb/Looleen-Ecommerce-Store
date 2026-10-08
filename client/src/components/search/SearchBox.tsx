import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Search, TrendingUp, X } from 'lucide-react'
import { Price, SmartImage } from '@/components/common'
import { useAsync, useDebounce } from '@/hooks'
import { useT } from '@/i18n'
import { getSearchSuggestions, POPULAR_SEARCHES } from '@/services/searchService'
import { cn } from '@/utils'

interface SearchBoxProps {
  /** Called after navigating (closes overlays) */
  onNavigate?: () => void
  autoFocus?: boolean
  /** `overlay` = full-screen mobile style, results always visible */
  variant?: 'header' | 'overlay'
  className?: string
}

/** Instant search with grouped suggestions and full keyboard support */
export function SearchBox({ onNavigate, autoFocus, variant = 'header', className }: SearchBoxProps) {
  const { t, l } = useT()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(variant === 'overlay')
  const [active, setActive] = useState(-1)
  const debounced = useDebounce(query, 200)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const { data } = useAsync(() => getSearchSuggestions(debounced), [debounced])

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    if (variant === 'overlay') return
    const onDoc = (e: MouseEvent) => !wrapRef.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [variant])

  /** Flat list of navigable options for arrow-key handling */
  const options = useMemo(() => {
    if (!data || !debounced.trim()) return POPULAR_SEARCHES.map((q) => ({ href: `/search?q=${encodeURIComponent(q)}`, key: `pop-${q}` }))
    return [
      ...data.products.map((p) => ({ href: `/product/${p.slug}`, key: p.id })),
      ...data.brands.map((b) => ({ href: `/brand/${b.slug}`, key: b.id })),
      ...data.categories.map((c) => ({ href: `/category/${c.slug}`, key: `c-${c.slug}` })),
    ]
  }, [data, debounced])

  const go = (href: string) => {
    navigate(href)
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
    onNavigate?.()
  }

  const submit = () => {
    if (active >= 0 && options[active]) return go(options[active].href)
    if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((a) => Math.min(options.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(-1, a - 1))
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  useEffect(() => setActive(-1), [debounced])

  const hasQuery = !!debounced.trim()
  const noResults = hasQuery && data && !data.products.length && !data.brands.length && !data.categories.length
  let idx = -1
  const optClass = (i: number) => cn('flex items-center gap-3 rounded-xs px-3 py-2 transition-colors', i === active ? 'bg-blush/70' : 'hover:bg-blush/50')

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            placeholder={t('common.searchPlaceholder')}
            aria-label={t('common.search')}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            className={cn(
              'w-full rounded-full border border-line bg-white/70 ps-11 pe-10 text-sm text-ink outline-none transition-all placeholder:text-muted/80 focus:border-ink/60 focus:bg-white [&::-webkit-search-cancel-button]:hidden',
              variant === 'overlay' ? 'h-13 text-base' : 'h-11',
            )}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label={t('common.clear')} className="absolute end-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-blush hover:text-ink">
              <X className="size-4" />
            </button>
          )}
        </div>
      </form>

      {open && (
        <div
          id={listId}
          role="listbox"
          className={cn(
            'z-50 overflow-y-auto bg-ivory',
            variant === 'header'
              ? 'absolute inset-x-0 top-[calc(100%+8px)] max-h-[70vh] animate-slide-down rounded-xs border border-line p-3 shadow-lift'
              : 'mt-4 max-h-[calc(100dvh-140px)]',
          )}
        >
          {!hasQuery && (
            <div className="p-2">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
                <TrendingUp className="size-3.5" aria-hidden />
                {t('nav.popularSearches')}
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((q, i) => (
                  <button
                    key={q}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    type="button"
                    onClick={() => go(`/search?q=${encodeURIComponent(q)}`)}
                    className={cn('rounded-full border border-line px-3.5 py-1.5 text-[13px] transition-colors hover:border-ink', i === active && 'border-ink bg-white')}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {noResults && <p className="p-4 text-sm text-muted">{t('empty.searchTitle', { query: debounced })}</p>}

          {hasQuery && data && !!data.products.length && (
            <div className="mb-2">
              <p className="px-3 pt-1 pb-2 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">{t('nav.products')}</p>
              {data.products.map((p) => {
                idx++
                const i = idx
                return (
                  <Link key={p.id} id={`${listId}-${i}`} role="option" aria-selected={i === active} to={`/product/${p.slug}`} onClick={(e) => (e.preventDefault(), go(`/product/${p.slug}`))} className={optClass(i)}>
                    <SmartImage src={p.thumbnail} alt="" width={96} height={120} wrapperClassName="h-14 w-11 shrink-0 rounded-xs" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10.5px] font-semibold tracking-[0.12em] text-muted uppercase">{p.brandName}</span>
                      <span className="block truncate text-sm text-ink">{p.name}</span>
                    </span>
                    <Price price={p.price} compareAtPrice={p.compareAtPrice} size="sm" className="shrink-0 flex-col items-end gap-0!" />
                  </Link>
                )
              })}
            </div>
          )}

          {hasQuery && data && (!!data.brands.length || !!data.categories.length) && (
            <div className="grid grid-cols-1 gap-2 border-t border-line pt-2 sm:grid-cols-2">
              {!!data.brands.length && (
                <div>
                  <p className="px-3 pt-1 pb-2 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">{t('nav.brands')}</p>
                  {data.brands.map((b) => {
                    idx++
                    const i = idx
                    return (
                      <Link key={b.id} id={`${listId}-${i}`} role="option" aria-selected={i === active} to={`/brand/${b.slug}`} onClick={(e) => (e.preventDefault(), go(`/brand/${b.slug}`))} className={cn(optClass(i), 'text-sm')}>
                        <span className="flex-1">{b.name}</span>
                        <ArrowUpRight className="size-3.5 text-muted rtl:-scale-x-100" aria-hidden />
                      </Link>
                    )
                  })}
                </div>
              )}
              {!!data.categories.length && (
                <div>
                  <p className="px-3 pt-1 pb-2 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">{t('nav.categories')}</p>
                  {data.categories.map((c) => {
                    idx++
                    const i = idx
                    return (
                      <Link key={c.slug} id={`${listId}-${i}`} role="option" aria-selected={i === active} to={`/category/${c.slug}`} onClick={(e) => (e.preventDefault(), go(`/category/${c.slug}`))} className={cn(optClass(i), 'text-sm')}>
                        <span className="flex-1">{l(c.name)}</span>
                        <ArrowUpRight className="size-3.5 text-muted rtl:-scale-x-100" aria-hidden />
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {hasQuery && (
            <button type="button" onClick={() => go(`/search?q=${encodeURIComponent(debounced.trim())}`)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xs bg-ink py-3 text-[13px] font-medium text-ivory hover:bg-ink-soft">
              <Search className="size-4" aria-hidden />
              {t('nav.seeAllResults', { query: debounced.trim() })}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
