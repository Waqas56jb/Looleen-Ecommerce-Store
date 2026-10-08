import type { ReactNode } from 'react'
import { Skeleton } from '@/components/common'
import type { Lang } from '@/types'
import { cn } from '@/utils'

/** Serif page title + short description shown at the top of each account page */
export function AccountPageHeader({ title, description, action, eyebrow }: { title: ReactNode; description?: ReactNode; action?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between lg:mb-10">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-serif text-3xl leading-tight font-medium tracking-[-0.02em] text-balance sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </header>
  )
}

/** White content panel */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  as: Tag = 'section',
}: {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  as?: 'section' | 'div' | 'article'
}) {
  return (
    <Tag className={cn('rounded-xs border border-line bg-white', className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {title && <h2 className="font-serif text-xl font-medium tracking-[-0.015em] sm:text-2xl">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn('p-5 sm:p-6', bodyClassName)}>{children}</div>
    </Tag>
  )
}

export function StatCard({ icon, label, value, hint, accent }: { icon: ReactNode; label: string; value: ReactNode; hint?: ReactNode; accent?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-4 rounded-xs border p-4 sm:p-5', accent ? 'border-ink bg-ink text-ivory' : 'border-line bg-white')}>
      <span
        className={cn('grid size-10 place-items-center rounded-full [&>svg]:size-[18px]', accent ? 'bg-white/10 text-champagne' : 'bg-blush text-rose')}
        aria-hidden
      >
        {icon}
      </span>
      <div>
        <p className="font-serif text-3xl leading-none font-medium tabular-nums sm:text-4xl">{value}</p>
        <p className={cn('mt-2 text-xs font-medium tracking-wide uppercase', accent ? 'text-ivory/70' : 'text-muted')}>{label}</p>
        {hint && <p className={cn('mt-1 text-xs', accent ? 'text-ivory/60' : 'text-muted')}>{hint}</p>}
      </div>
    </div>
  )
}

/** Horizontal scrollable filter chips (radio-like) */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { id: T; label: string; count?: number }[]
  value: T
  onChange: (v: T) => void
  label: string
  className?: string
}) {
  return (
    <div role="group" aria-label={label} className={cn('no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0', className)}>
      {options.map((o) => {
        const active = o.id === value
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.id)}
            className={cn(
              'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-colors',
              active ? 'border-ink bg-ink text-ivory' : 'border-line bg-white text-ink hover:border-ink/50',
            )}
          >
            {o.label}
            {o.count !== undefined && <span className={cn('text-xs tabular-nums', active ? 'text-ivory/70' : 'text-muted')}>{o.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function PanelSkeleton({ rows = 3, className, bare }: { rows?: number; className?: string; bare?: boolean }) {
  return (
    <div className={cn('space-y-3 p-5 sm:p-6', !bare && 'rounded-xs border border-line bg-white', className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="size-14 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/** "2 hours ago" / "منذ ساعتين" using Intl */
export function relativeTime(iso: string, lang: Lang): string {
  const rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar' : 'en', { numeric: 'auto' })
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return rtf.format(Math.round(diff), 'second')
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86_400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86_400 * 30) return rtf.format(Math.round(diff / 86_400), 'day')
  if (abs < 86_400 * 365) return rtf.format(Math.round(diff / (86_400 * 30)), 'month')
  return rtf.format(Math.round(diff / (86_400 * 365)), 'year')
}
