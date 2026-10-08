import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '@/i18n'

/** Title row used as a DataTable toolbar on dashboard / report cards */
export function TableHeading({ title, description, to, linkLabel, actions }: { title: ReactNode; description?: ReactNode; to?: string; linkLabel?: string; actions?: ReactNode }) {
  const { t } = useT()
  return (
    <div className="flex w-full min-w-0 items-start justify-between gap-3 px-1">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        {to && (
          <Link to={to} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-[13px] font-medium text-ink hover:bg-mist">
            {linkLabel ?? t('common.viewAll')}
            <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  )
}

/** "+12.4%" / "−3.1%" with arrow, colored by direction */
export function TrendValue({ value, inverse }: { value: number; inverse?: boolean }) {
  const up = value >= 0
  const good = inverse ? !up : up
  return (
    <span className={`inline-flex items-center gap-0.5 text-[12.5px] font-medium tabular-nums ${good ? 'text-success' : 'text-error'}`} dir="ltr">
      {up ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
      {up ? '+' : '−'}
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}
