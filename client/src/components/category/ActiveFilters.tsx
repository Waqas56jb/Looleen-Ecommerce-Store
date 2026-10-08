import { X } from 'lucide-react'
import { CONCERN_LABELS, HAIR_TYPE_LABELS, SKIN_TYPE_LABELS } from '@/data/categories'
import { useT } from '@/i18n'
import type { Concern } from '@/types'
import { cn } from '@/utils'
import type { ArrayFilterKey } from './catalogModel'
import type { CatalogQuery } from './useCatalogQuery'

interface Chip {
  id: string
  label: string
  onRemove: () => void
}

/** Removable chips for every active facet value + "Clear all" */
export function ActiveFilters({ catalog, className }: { catalog: CatalogQuery; className?: string }) {
  const { t, l } = useT()
  const { filters, facets, hidden, toggleValue, setFilter, clearAll } = catalog
  const brandName = (id: string) => facets?.brands.find((b) => b.value === id)?.label ?? id

  const chips: Chip[] = []
  const arr = (key: ArrayFilterKey, label: (v: string) => string) => {
    if (hidden.includes(key)) return
    ;(filters[key] as string[]).forEach((v) => chips.push({ id: `${key}-${v}`, label: label(v), onRemove: () => toggleValue(key, v) }))
  }
  arr('brands', brandName)
  arr('price', (v) => t(`catalog.price.${v}`))
  if (filters.rating) chips.push({ id: 'rating', label: t('catalog.ratingChip', { value: filters.rating }), onRemove: () => setFilter('rating', undefined) })
  if (filters.discount) chips.push({ id: 'discount', label: t('catalog.discountChip', { value: filters.discount }), onRemove: () => setFilter('discount', undefined) })
  if (filters.stock) chips.push({ id: 'stock', label: t('catalog.inStockChip'), onRemove: () => setFilter('stock', false) })
  arr('skin', (v) => l(SKIN_TYPE_LABELS[v]) || v)
  arr('hair', (v) => l(HAIR_TYPE_LABELS[v]) || v)
  arr('concern', (v) => l(CONCERN_LABELS[v as Concern]) || v)
  if (filters.pro && !hidden.includes('pro')) chips.push({ id: 'pro', label: t('catalog.proChip'), onRemove: () => setFilter('pro', false) })

  if (!chips.length) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} aria-label={t('filters.active')} role="group">
      {chips.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={c.onRemove}
          aria-label={t('catalog.removeFilter', { label: c.label })}
          className="group inline-flex h-9 animate-scale-in items-center gap-1.5 rounded-full border border-line bg-white ps-3.5 pe-2.5 text-[13px] text-ink transition-colors hover:border-ink"
        >
          {c.label}
          <X className="size-3.5 text-muted transition-colors group-hover:text-ink" aria-hidden />
        </button>
      ))}
      <button type="button" onClick={clearAll} className="h-9 px-2 text-[13px] font-medium text-rose underline-offset-4 hover:underline">
        {t('common.clearAll')}
      </button>
    </div>
  )
}
