import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card, EmptyState, ErrorState, Skeleton, Thumb } from '@/components/ui'
import { cn } from '@/utils'

export interface RankedItem {
  id: string
  to: string
  image?: string
  title: string
  subtitle?: ReactNode
  /** Primary metric (end aligned, bold) */
  value: ReactNode
  /** Secondary metric under the value */
  secondary?: ReactNode
}

/** Compact ranked table in a card — reads as a list on every screen size */
export function RankedList({
  title,
  description,
  items,
  loading,
  error,
  onRetry,
  valueLabel,
  secondaryLabel,
  emptyLabel,
  icon,
  className,
  maxHeight,
}: {
  title: ReactNode
  description?: ReactNode
  items?: RankedItem[]
  loading?: boolean
  error?: unknown
  onRetry?: () => void
  valueLabel: string
  secondaryLabel?: string
  emptyLabel?: string
  icon?: ReactNode
  className?: string
  /** Scroll long lists (≈ 8 rows visible; full list when printing) */
  maxHeight?: boolean
}) {
  return (
    <Card title={title} description={description} className={className} padded={false} actions={icon && <span className="grid size-8 place-items-center rounded-md bg-mist text-ink [&>svg]:size-4">{icon}</span>}>
      {error ? (
        <ErrorState onRetry={onRetry} className="py-8" />
      ) : !items ? (
        <div className="space-y-3 px-5 pb-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : !items.length ? (
        <EmptyState title={emptyLabel ?? '—'} className="py-8" />
      ) : (
        <div className={cn(loading && 'opacity-60 transition-opacity')}>
          <div className="flex items-center justify-between border-y border-line-soft bg-mist/40 px-5 py-1.5 text-[10.5px] font-semibold tracking-wide text-subtle uppercase">
            <span>#</span>
            <span>
              {valueLabel}
              {secondaryLabel && <span className="font-normal"> · {secondaryLabel}</span>}
            </span>
          </div>
          <ol className={cn('divide-y divide-line-soft', maxHeight && 'thin-scrollbar max-h-[460px] overflow-y-auto print:max-h-none print:overflow-visible')}>
            {items.map((it, i) => (
              <li key={it.id}>
                <Link to={it.to} className="flex min-h-14 items-center gap-3 px-5 py-2.5 transition-colors hover:bg-mist/60 focus-visible:bg-mist">
                  <span className={cn('w-5 shrink-0 text-center text-xs font-semibold tabular-nums', i < 3 ? 'text-rose-dark' : 'text-subtle')}>{i + 1}</span>
                  <Thumb src={it.image} alt={it.title} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{it.title}</p>
                    {it.subtitle && <p className="truncate text-xs text-muted">{it.subtitle}</p>}
                  </div>
                  <div className="shrink-0 text-end">
                    <div className="text-[13px] font-semibold text-ink tabular-nums">{it.value}</div>
                    {it.secondary && <div className="text-[11.5px] text-muted tabular-nums">{it.secondary}</div>}
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  )
}
