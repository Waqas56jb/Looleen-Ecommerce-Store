import { useId } from 'react'
import { ChevronDown, LayoutGrid, List } from 'lucide-react'
import { useT } from '@/i18n'
import type { SortOption } from '@/types'
import { cn } from '@/utils'
import { SORT_OPTIONS } from '@/utils/catalog'
import type { CatalogViewMode } from './catalogModel'

export function SortSelect({ value, onChange, className }: { value: SortOption; onChange: (s: SortOption) => void; className?: string }) {
  const { t } = useT()
  const id = useId()
  return (
    <div className={cn('relative flex items-center', className)}>
      <label htmlFor={id} className="sr-only sm:not-sr-only sm:me-2 sm:text-[13px] sm:whitespace-nowrap sm:text-muted">
        {t('sort.label')}
      </label>
      <div className="relative min-w-0 flex-1">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as SortOption)}
          className="h-11 w-full appearance-none rounded-full border border-line bg-white/80 ps-4 pe-9 text-[13px] font-medium text-ink outline-none transition-colors hover:border-ink/50 focus:border-ink"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {t(`sort.${s}`)}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      </div>
    </div>
  )
}

export function ViewToggle({ value, onChange, className }: { value: CatalogViewMode; onChange: (v: CatalogViewMode) => void; className?: string }) {
  const { t } = useT()
  const opts = [
    { v: 'grid' as const, label: t('filters.grid'), Icon: LayoutGrid },
    { v: 'list' as const, label: t('filters.list'), Icon: List },
  ]
  return (
    <div role="group" aria-label={t('catalog.viewAs')} className={cn('inline-flex h-11 items-center rounded-full border border-line bg-white/80 p-1', className)}>
      {opts.map(({ v, label, Icon }) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          aria-label={label}
          title={label}
          onClick={() => onChange(v)}
          className={cn('grid size-9 place-items-center rounded-full transition-colors', value === v ? 'bg-ink text-ivory' : 'text-muted hover:text-ink')}
        >
          <Icon className="size-4" aria-hidden />
        </button>
      ))}
    </div>
  )
}
