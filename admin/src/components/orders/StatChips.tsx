import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui'
import { cn, formatNumber } from '@/utils'

export interface StatChipItem {
  key: string
  label: ReactNode
  value: number | undefined
  /** Custom rendered value (e.g. Money) */
  display?: ReactNode
  dot?: string
}

/** Clickable KPI chips that act as quick status filters (orders & returns) */
export function StatChips({ items, active, onSelect, loading, className }: { items: StatChipItem[]; active: string; onSelect?: (key: string) => void; loading?: boolean; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7', className)}>
      {items.map((it) => {
        const isActive = active === it.key
        const body = (
          <>
            <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
              {it.dot && <span className={cn('size-1.5 rounded-full', it.dot)} aria-hidden />}
              <span className="truncate">{it.label}</span>
            </span>
            {loading && it.value === undefined ? <Skeleton className="mt-2 h-6 w-14" /> : <span className="mt-1.5 block text-xl font-semibold tracking-tight text-ink tabular-nums">{it.display ?? formatNumber(it.value ?? 0)}</span>}
          </>
        )
        return onSelect ? (
          <button
            key={it.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(it.key)}
            className={cn('card min-w-0 px-4 py-3 text-start transition-colors hover:border-ink/25', isActive && 'border-ink ring-1 ring-ink')}
          >
            {body}
          </button>
        ) : (
          <div key={it.key} className="card min-w-0 px-4 py-3">
            {body}
          </div>
        )
      })}
    </div>
  )
}
