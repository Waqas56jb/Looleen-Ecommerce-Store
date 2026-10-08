import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { Button, Checkbox, Drawer, Dropdown } from '@/components/ui'
import { useDebounce } from '@/hooks'
import { useT } from '@/i18n'
import { cn } from '@/utils'

/**
 * Filters that render inline on desktop and inside a "Filters" drawer on mobile.
 * `children` is rendered in both places, so keep it controlled.
 */
export function ResponsiveFilters({ children, activeCount, onClear }: { children: ReactNode; activeCount: number; onClear?: () => void }) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="hidden flex-wrap items-center gap-2 md:flex">
        {children}
        {activeCount > 0 && onClear && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            {t('common.clearAll')}
          </Button>
        )}
      </div>
      <Button variant="outline" size="sm" className="h-9 md:hidden" icon={<SlidersHorizontal className="size-4" />} onClick={() => setOpen(true)}>
        {t('common.filters')}
        {activeCount > 0 && <span className="rounded bg-ink px-1.5 text-[11px] text-white tabular-nums">{activeCount}</span>}
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={t('common.filters')}
        footer={
          <>
            {onClear && (
              <Button variant="outline" fullWidth onClick={onClear} disabled={activeCount === 0}>
                {t('common.clearAll')}
              </Button>
            )}
            <Button fullWidth onClick={() => setOpen(false)}>
              {t('common.apply')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 p-5 [&>*]:w-full [&_select]:w-full">{children}</div>
      </Drawer>
    </>
  )
}

/** Compact select used in list toolbars (label is visually hidden). */
export function FilterSelect({ label, value, onChange, options, allLabel, className }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; allLabel: string; className?: string }) {
  return (
    <label className={cn('relative block min-w-0', className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-9 w-full appearance-none rounded-md border border-line bg-surface ps-3 pe-8 text-[13px] text-ink outline-none transition-colors hover:border-ink/25 focus:border-ink/40 focus:ring-3 focus:ring-rose/12',
          value && 'border-ink/30 font-medium',
        )}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
    </label>
  )
}

/** Multi-select dropdown with checkboxes (e.g. cities). */
export function MultiSelectFilter({ label, value, onChange, options, allLabel, countLabel }: { label: string; value: string[]; onChange: (v: string[]) => void; options: { value: string; label: string }[]; allLabel: string; countLabel: (count: number) => string }) {
  const { t } = useT()
  const summary = value.length === 0 ? allLabel : value.length === 1 ? (options.find((o) => o.value === value[0])?.label ?? value[0]) : countLabel(value.length)
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  return (
    <Dropdown
      align="start"
      widthClass="w-60"
      className="max-md:w-full"
      trigger={({ toggle: open, open: isOpen }) => (
        <button
          type="button"
          onClick={open}
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label={label}
          className={cn(
            'inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-line bg-surface ps-3 pe-2.5 text-[13px] text-ink transition-colors hover:border-ink/25',
            value.length > 0 && 'border-ink/30 font-medium',
          )}
        >
          <span className="truncate">{summary}</span>
          <ChevronDown className="size-4 shrink-0 text-subtle" aria-hidden />
        </button>
      )}
    >
      <div className="thin-scrollbar max-h-72 space-y-2 overflow-y-auto p-3">
        {options.map((o) => (
          <Checkbox key={o.value} label={o.label} checked={value.includes(o.value)} onChange={() => toggle(o.value)} className="flex" />
        ))}
      </div>
      {value.length > 0 && (
        <div className="border-t border-line-soft px-3 py-2">
          <button type="button" onClick={() => onChange([])} className="text-xs font-medium text-muted hover:text-ink">
            {t('common.clear')}
          </button>
        </div>
      )}
    </Dropdown>
  )
}

/**
 * Local search box state debounced into the URL-synced list state.
 *   const [search, setSearch] = useDebouncedSearch(list.search, list.setSearch)
 */
export function useDebouncedSearch(urlValue: string, commit: (v: string) => void, ms = 300) {
  const [value, setValue] = useState(urlValue)
  const debounced = useDebounce(value, ms)
  const commitRef = useRef(commit)
  commitRef.current = commit
  useEffect(() => {
    if (debounced !== urlValue) commitRef.current(debounced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])
  // External resets (e.g. "clear filters") flow back into the input
  useEffect(() => {
    if (urlValue !== value && urlValue !== debounced) setValue(urlValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlValue])
  return [value, setValue] as const
}
