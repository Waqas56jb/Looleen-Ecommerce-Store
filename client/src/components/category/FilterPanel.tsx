import { useMemo, useState, type ReactNode } from 'react'
import { Search } from 'lucide-react'
import { AccordionItem, Checkbox, Skeleton } from '@/components/common'
import { CONCERN_LABELS, HAIR_TYPE_LABELS, SKIN_TYPE_LABELS } from '@/data/categories'
import { useT } from '@/i18n'
import type { Concern, HairType, PriceRange, SkinType } from '@/types'
import { cn } from '@/utils'
import type { FacetOption } from './catalogModel'
import type { CatalogQuery } from './useCatalogQuery'

/** Pill toggle used for single-choice filters (rating, discount) */
export function FilterChip({ active, onClick, children, disabled }: { active: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40',
        active ? 'border-ink bg-ink text-ivory' : 'border-line bg-white/70 text-ink hover:border-ink/60',
      )}
    >
      {children}
    </button>
  )
}

function SectionTitle({ label, count }: { label: string; count: number }) {
  return (
    <span className="flex items-center gap-2">
      {label}
      {count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1.5 text-[10.5px] font-semibold text-white tabular-nums">{count}</span>}
    </span>
  )
}

/** Keeps currently-selected values visible even if the base set has none (e.g. a deep link) */
function withSelected(options: FacetOption[], selected: string[]): FacetOption[] {
  const missing = selected.filter((s) => !options.some((o) => o.value === s)).map((value) => ({ value, count: 0 }))
  return [...options, ...missing]
}

export function FilterPanel({ catalog, className }: { catalog: CatalogQuery; className?: string }) {
  const { t, l } = useT()
  const { facets, filters, hidden, setFilter, toggleValue } = catalog
  const [brandQuery, setBrandQuery] = useState('')

  const brandOptions = useMemo(() => {
    const opts = withSelected(facets?.brands ?? [], filters.brands)
    const q = brandQuery.trim().toLowerCase()
    return q ? opts.filter((o) => (o.label ?? o.value).toLowerCase().includes(q)) : opts
  }, [facets, filters.brands, brandQuery])

  if (!facets) {
    return (
      <div className={cn('space-y-6 py-4', className)} aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    )
  }

  const skin = withSelected(facets.skin, filters.skin)
  const hair = withSelected(facets.hair, filters.hair)
  const concern = withSelected(facets.concern, filters.concern)
  const showBrands = !hidden.includes('brands') && (facets.brands.length > 1 || filters.brands.length > 0)
  const showDiscount = facets.discount.some((d) => d.count > 0) || !!filters.discount
  const showPro = !hidden.includes('pro') && ((facets.pro > 0 && facets.pro < facets.total) || filters.pro)
  const optionLabel = 'text-[14px] text-ink'

  return (
    <div className={cn('border-t border-line', className)}>
      {showBrands && (
        <AccordionItem defaultOpen title={<SectionTitle label={t('filters.brand')} count={filters.brands.length} />}>
          {facets.brands.length > 8 && (
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                type="search"
                value={brandQuery}
                onChange={(e) => setBrandQuery(e.target.value)}
                placeholder={t('filters.searchBrands')}
                aria-label={t('filters.searchBrands')}
                className="h-10 w-full rounded-full border border-line bg-white/80 ps-9 pe-3 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-ink/60 [&::-webkit-search-cancel-button]:hidden"
              />
            </div>
          )}
          <div className="no-scrollbar -mx-1 max-h-72 overflow-y-auto px-1">
            {brandOptions.map((o) => (
              <Checkbox
                key={o.value}
                label={<span className={optionLabel}>{o.label ?? o.value}</span>}
                count={o.count}
                checked={filters.brands.includes(o.value)}
                onChange={() => toggleValue('brands', o.value)}
              />
            ))}
            {!brandOptions.length && <p className="py-2 text-sm">{t('catalog.noBrandMatch', { query: brandQuery })}</p>}
          </div>
        </AccordionItem>
      )}

      <AccordionItem defaultOpen title={<SectionTitle label={t('filters.price')} count={filters.price.length} />}>
        {facets.price.map((o) => (
          <Checkbox
            key={o.value}
            label={<span className={optionLabel}>{t(`catalog.price.${o.value}`)}</span>}
            count={o.count}
            checked={filters.price.includes(o.value as PriceRange)}
            disabled={!o.count && !filters.price.includes(o.value)}
            className={cn(!o.count && !filters.price.includes(o.value) && 'cursor-not-allowed opacity-40')}
            onChange={() => toggleValue('price', o.value)}
          />
        ))}
      </AccordionItem>

      <AccordionItem defaultOpen={!!filters.rating} title={<SectionTitle label={t('filters.rating')} count={filters.rating ? 1 : 0} />}>
        <div className="flex flex-wrap gap-2">
          {facets.rating.map((o) => (
            <FilterChip
              key={o.value}
              active={filters.rating === o.value}
              disabled={!o.count && filters.rating !== o.value}
              onClick={() => setFilter('rating', filters.rating === o.value ? undefined : o.value)}
            >
              {t('filters.andUp', { value: o.value })}
              <span className="text-[11px] opacity-60">({o.count})</span>
            </FilterChip>
          ))}
        </div>
      </AccordionItem>

      {showDiscount && (
        <AccordionItem defaultOpen={!!filters.discount} title={<SectionTitle label={t('filters.discount')} count={filters.discount ? 1 : 0} />}>
          <div className="flex flex-wrap gap-2">
            {facets.discount.map((o) => (
              <FilterChip
                key={o.value}
                active={filters.discount === o.value}
                disabled={!o.count && filters.discount !== o.value}
                onClick={() => setFilter('discount', filters.discount === o.value ? undefined : o.value)}
              >
                {t('filters.discountAtLeast', { value: o.value })}
              </FilterChip>
            ))}
          </div>
        </AccordionItem>
      )}

      <AccordionItem defaultOpen={filters.stock} title={<SectionTitle label={t('filters.availability')} count={filters.stock ? 1 : 0} />}>
        <Checkbox
          label={<span className={optionLabel}>{t('filters.inStockOnly')}</span>}
          count={facets.inStock}
          checked={filters.stock}
          onChange={(e) => setFilter('stock', e.target.checked)}
        />
      </AccordionItem>

      {skin.length > 0 && (
        <AccordionItem defaultOpen={filters.skin.length > 0} title={<SectionTitle label={t('filters.skinType')} count={filters.skin.length} />}>
          {skin.map((o) => (
            <Checkbox
              key={o.value}
              label={<span className={optionLabel}>{l(SKIN_TYPE_LABELS[o.value]) || o.value}</span>}
              count={o.count}
              checked={filters.skin.includes(o.value as SkinType)}
              onChange={() => toggleValue('skin', o.value)}
            />
          ))}
        </AccordionItem>
      )}

      {hair.length > 0 && (
        <AccordionItem defaultOpen={filters.hair.length > 0} title={<SectionTitle label={t('filters.hairType')} count={filters.hair.length} />}>
          {hair.map((o) => (
            <Checkbox
              key={o.value}
              label={<span className={optionLabel}>{l(HAIR_TYPE_LABELS[o.value]) || o.value}</span>}
              count={o.count}
              checked={filters.hair.includes(o.value as HairType)}
              onChange={() => toggleValue('hair', o.value)}
            />
          ))}
        </AccordionItem>
      )}

      {concern.length > 0 && (
        <AccordionItem defaultOpen={filters.concern.length > 0} title={<SectionTitle label={t('filters.concern')} count={filters.concern.length} />}>
          {concern.map((o) => (
            <Checkbox
              key={o.value}
              label={<span className={optionLabel}>{l(CONCERN_LABELS[o.value as Concern]) || o.value}</span>}
              count={o.count}
              checked={filters.concern.includes(o.value as Concern)}
              onChange={() => toggleValue('concern', o.value)}
            />
          ))}
        </AccordionItem>
      )}

      {showPro && (
        <AccordionItem defaultOpen={filters.pro} title={<SectionTitle label={t('filters.professional')} count={filters.pro ? 1 : 0} />}>
          <Checkbox
            label={<span className={optionLabel}>{t('filters.professionalOnly')}</span>}
            count={facets.pro}
            checked={filters.pro}
            onChange={(e) => setFilter('pro', e.target.checked)}
          />
        </AccordionItem>
      )}
    </div>
  )
}
