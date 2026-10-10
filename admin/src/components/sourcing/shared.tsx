import { CheckCircle2, CircleAlert, XCircle } from 'lucide-react'
import { Badge, StatusBadge } from '@/components/ui'
import { useT } from '@/i18n'
import type { ApprovalCheck, SourcingStatus } from '@/types/sourcing'
import { cn } from '@/utils'

export function BrandTile({ brand, className }: { brand: string; className?: string }) {
  return (
    <span aria-hidden className={cn('grid size-10 shrink-0 place-items-center rounded-md border border-line bg-champagne-soft text-[11px] font-semibold tracking-wide text-[#7a5a26] uppercase', className)}>
      {brand.split(' ')[0].slice(0, 5)}
    </span>
  )
}

export function SourcingStatusBadge({ status, short }: { status: SourcingStatus; short?: boolean }) {
  const { t } = useT()
  return <StatusBadge status={status} label={t(`sourcing.${short ? 'statusShort' : 'status'}.${status}`)} />
}

export function Pct({ value, className }: { value: number | null | undefined; className?: string }) {
  if (value === null || value === undefined || !Number.isFinite(value)) return <span className={cn('text-subtle', className)}>—</span>
  const tone = value < 0 ? 'text-error' : value < 0.25 ? 'text-warning' : 'text-success'
  return (
    <span className={cn('font-medium tabular-nums', tone, className)} dir="ltr">
      {(value * 100).toFixed(1)}%
    </span>
  )
}

export function CheckList({ checks }: { checks: ApprovalCheck[] }) {
  const { t } = useT()
  return (
    <ul className="space-y-2.5">
      {checks.map((c) => {
        const Icon = c.ok ? CheckCircle2 : c.blocking ? XCircle : CircleAlert
        return (
          <li key={c.id} className="flex items-start gap-2.5">
            <Icon className={cn('mt-0.5 size-[18px] shrink-0', c.ok ? 'text-success' : c.blocking ? 'text-error' : 'text-warning')} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className={cn('text-[13px] leading-snug', c.ok ? 'text-ink' : 'font-medium text-ink')}>{t(`sourcing.checks.${c.key.replace('checks.', '')}`, c.vars)}</p>
            </div>
            {!c.ok && (
              <Badge tone={c.blocking ? 'error' : 'warning'} className="shrink-0">
                {t(c.blocking ? 'sourcing.detail.required' : 'sourcing.detail.warning')}
              </Badge>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** "3 / 4" with a small progress bar */
export function RetailerProgress({ count, min }: { count: number; min: number }) {
  const ok = count >= min
  return (
    <div className="min-w-24">
      <p className="text-[12.5px] tabular-nums" dir="ltr">
        <span className={cn('font-semibold', ok ? 'text-success' : 'text-ink')}>{count}</span>
        <span className="text-subtle"> / {min}</span>
      </p>
      <div className="mt-1 flex gap-0.5" aria-hidden>
        {Array.from({ length: Math.max(min, count) }, (_, i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < count ? (ok ? 'bg-success' : 'bg-warning') : 'bg-line')} />
        ))}
      </div>
    </div>
  )
}
