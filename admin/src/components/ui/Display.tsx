import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowDownRight, ArrowUpRight, ChevronRight, ImageOff, Inbox, Star } from 'lucide-react'
import { useT } from '@/i18n'
import { cn, formatNumber, imageUrl, initials } from '@/utils'
import { Button, ButtonLink } from './Button'

/* ---------------- Money (official Saudi Riyal sign) ---------------- */

export function RiyalSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1124.14 1256.39" aria-hidden="true" focusable="false" fill="currentColor" className={cn('inline-block h-[0.8em] w-auto shrink-0', className)}>
      <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" />
      <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" />
    </svg>
  )
}

/** Amount with the Riyal sign on the left (SAMA guideline). Screen readers hear "1,240 SAR" / "1,240 ريال". */
export function Money({ value, className, compact, decimals }: { value: number; className?: string; compact?: boolean; decimals?: number }) {
  const { lang } = useT()
  const n = compact && Math.abs(value) >= 10_000 ? Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value) : formatNumber(value, decimals)
  return (
    <span className={cn('relative inline-flex items-baseline gap-[0.22em] whitespace-nowrap tabular-nums', className)} dir="ltr">
      <RiyalSign className="translate-y-[0.05em]" />
      <span aria-hidden>{n}</span>
      <span className="sr-only">{lang === 'ar' ? `${n} ريال` : `${n} SAR`}</span>
    </span>
  )
}

/** Price with optional strike-through compare price */
export function PriceDisplay({ price, compareAt, className }: { price: number; compareAt?: number; className?: string }) {
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-1.5', className)}>
      <Money value={price} className="font-medium text-ink" />
      {compareAt && compareAt > price && <Money value={compareAt} className="text-xs text-subtle line-through" />}
    </span>
  )
}

/* ---------------- Card ---------------- */

export function Card({ children, className, title, description, actions, padded = true, footer }: { children: ReactNode; className?: string; title?: ReactNode; description?: ReactNode; actions?: ReactNode; padded?: boolean; footer?: ReactNode }) {
  return (
    <section className={cn('card flex min-w-0 flex-col', className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('min-w-0 flex-1', padded && 'px-5 pb-5', padded && !(title || actions) && 'pt-5')}>{children}</div>
      {footer && <footer className="border-t border-line-soft px-5 py-3">{footer}</footer>}
    </section>
  )
}

/* ---------------- StatCard (KPI) ---------------- */

interface StatCardProps {
  label: ReactNode
  value: ReactNode
  icon?: ReactNode
  change?: number
  period?: ReactNode
  href?: string
  tone?: 'default' | 'warning' | 'error' | 'success'
  loading?: boolean
  /** Lower is better (e.g. returns) — flips the trend color */
  inverse?: boolean
}

export function StatCard({ label, value, icon, change, period, href, tone = 'default', loading, inverse }: StatCardProps) {
  const up = (change ?? 0) >= 0
  const good = inverse ? !up : up
  const body = (
    <div className={cn('card flex h-full min-w-0 flex-col gap-3 p-4 transition-colors sm:p-5', href && 'hover:border-ink/20')}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        {icon && (
          <span
            className={cn(
              'grid size-8 shrink-0 place-items-center rounded-md [&>svg]:size-4',
              tone === 'default' && 'bg-mist text-ink',
              tone === 'warning' && 'bg-warning-soft text-warning',
              tone === 'error' && 'bg-error-soft text-error',
              tone === 'success' && 'bg-success-soft text-success',
            )}
          >
            {icon}
          </span>
        )}
      </div>
      {loading ? <Skeleton className="h-7 w-28" /> : <p className="text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</p>}
      {(change !== undefined || period) && (
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          {change !== undefined && (
            <span className={cn('inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-medium', good ? 'bg-success-soft text-success' : 'bg-error-soft text-error')} dir="ltr">
              {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
          {period}
        </p>
      )}
    </div>
  )
  return href ? (
    <Link to={href} className="block h-full rounded-lg">
      {body}
    </Link>
  ) : (
    body
  )
}

/* ---------------- Badge / StatusBadge ---------------- */

export type Tone = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'rose' | 'champagne' | 'dark'

const toneClass: Record<Tone, string> = {
  neutral: 'bg-mist text-muted border-line',
  success: 'bg-success-soft text-success border-success/15',
  warning: 'bg-warning-soft text-warning border-warning/15',
  error: 'bg-error-soft text-error border-error/15',
  info: 'bg-info-soft text-info border-info/15',
  rose: 'bg-rose-soft text-rose-dark border-rose/20',
  champagne: 'bg-champagne-soft text-[#7a5a26] border-champagne/25',
  dark: 'bg-ink text-white border-ink',
}

export function Badge({ tone = 'neutral', children, className, dot, icon }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean; icon?: ReactNode }) {
  return (
    <span className={cn('inline-flex h-[22px] items-center gap-1.5 rounded-md border px-2 text-[11.5px] font-medium whitespace-nowrap [&>svg]:size-3', toneClass[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {icon}
      {children}
    </span>
  )
}

const STATUS_TONE: Record<string, Tone> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  packed: 'champagne',
  shipped: 'rose',
  out_for_delivery: 'rose',
  delivered: 'success',
  cancelled: 'neutral',
  refunded: 'error',
  paid: 'success',
  failed: 'error',
  active: 'success',
  draft: 'neutral',
  archived: 'neutral',
  out_of_stock: 'error',
  in_stock: 'success',
  low_stock: 'warning',
  critical: 'error',
  low: 'warning',
  healthy: 'success',
  scheduled: 'info',
  expired: 'neutral',
  disabled: 'neutral',
  ended: 'neutral',
  published: 'success',
  approved: 'success',
  rejected: 'error',
  hidden: 'neutral',
  requested: 'warning',
  pickup_scheduled: 'info',
  received: 'champagne',
  inactive: 'neutral',
  regular: 'neutral',
  professional: 'champagne',
  vip: 'dark',
  invited: 'info',
  open: 'warning',
  answered: 'info',
  closed: 'neutral',
  success: 'success',
}

/** Consistent status colors across orders, products, coupons, reviews, returns… */
export function StatusBadge({ status, className, label }: { status: string; className?: string; label?: string }) {
  const { t } = useT()
  return (
    <Badge tone={STATUS_TONE[status] ?? 'neutral'} dot className={className}>
      {label ?? t(`status.${status}`)}
    </Badge>
  )
}

/* ---------------- Avatar ---------------- */

export function Avatar({ name, src, size = 'md', className }: { name: string; src?: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const [err, setErr] = useState(false)
  const s = size === 'sm' ? 'size-7 text-[10px]' : size === 'md' ? 'size-9 text-xs' : size === 'lg' ? 'size-12 text-sm' : 'size-16 text-lg'
  return (
    <span className={cn('relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-blush font-semibold text-rose-dark', s, className)} aria-hidden={!src}>
      {src && !err ? <img src={imageUrl(src, 120, 120)} alt={name} className="size-full object-cover" onError={() => setErr(true)} /> : initials(name)}
    </span>
  )
}

/* ---------------- Thumb (image with fallback) ---------------- */

export function Thumb({ src, alt, size = 'md', className }: { src?: string; alt: string; size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string }) {
  const [err, setErr] = useState(false)
  const s = size === 'xs' ? 'size-8' : size === 'sm' ? 'size-10' : size === 'md' ? 'size-12' : 'size-16'
  return (
    <span className={cn('relative inline-grid shrink-0 place-items-center overflow-hidden rounded-md border border-line-soft bg-mist text-subtle', s, className)}>
      {src && !err ? <img src={imageUrl(src, 160, 160)} alt={alt} loading="lazy" onError={() => setErr(true)} className="size-full object-cover" /> : <ImageOff className="size-4" aria-label={alt} />}
    </span>
  )
}

/** Larger image with graceful fallback (banners, galleries) */
export function Img({ src, alt, w = 800, h, className }: { src?: string; alt: string; w?: number; h?: number; className?: string }) {
  const [err, setErr] = useState(false)
  if (!src || err)
    return (
      <span role="img" aria-label={alt} className={cn('grid place-items-center bg-gradient-to-br from-blush to-champagne-soft text-ink/30', className)}>
        <ImageOff className="size-6" />
      </span>
    )
  return <img src={imageUrl(src, w, h)} alt={alt} loading="lazy" onError={() => setErr(true)} className={cn('object-cover', className)} />
}

/* ---------------- RatingStars ---------------- */

export function RatingStars({ rating, size = 13, showValue }: { rating: number; size?: number; showValue?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`${rating.toFixed(1)} / 5`}>
      <span className="relative inline-flex">
        <span className="flex text-line">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
          ))}
        </span>
        <span className="absolute inset-0 flex overflow-hidden text-champagne" style={{ width: `${(rating / 5) * 100}%` }}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} style={{ width: size, height: size }} className="shrink-0" fill="currentColor" strokeWidth={0} />
          ))}
        </span>
      </span>
      {showValue && <span className="text-xs font-medium text-ink tabular-nums">{rating.toFixed(1)}</span>}
    </span>
  )
}

/* ---------------- Breadcrumbs & page header ---------------- */

export interface Crumb {
  label: string
  to?: string
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const { t } = useT()
  const all = [{ label: t('nav.dashboard'), to: '/dashboard' }, ...items]
  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex min-w-0 items-center gap-1 text-[12.5px] text-muted">
        {all.map((c, i) => (
          <li key={i} className="flex min-w-0 items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-subtle rtl:-scale-x-100" aria-hidden />}
            {c.to && i < all.length - 1 ? (
              <Link to={c.to} className="truncate hover:text-ink">
                {c.label}
              </Link>
            ) : (
              <span className="truncate text-ink" aria-current={i === all.length - 1 ? 'page' : undefined}>
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  breadcrumbs?: Crumb[]
  actions?: ReactNode
  meta?: ReactNode
  className?: string
}

/** Consistent page header: breadcrumb · title · description · actions */
export function PageHeader({ title, description, breadcrumbs, actions, meta, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6 flex flex-col gap-4 lg:mb-8', className)}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[22px] font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
            {meta}
          </div>
          {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div>}
      </div>
    </header>
  )
}

/* ---------------- Tabs ---------------- */

export function Tabs<V extends string>({ tabs, value, onChange, className }: { tabs: { value: V; label: ReactNode; count?: number }[]; value: V; onChange: (v: V) => void; className?: string }) {
  return (
    <div role="tablist" className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b border-line', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          type="button"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            '-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors',
            value === tab.value ? 'border-rose text-ink' : 'border-transparent text-muted hover:text-ink',
          )}
        >
          {tab.label}
          {tab.count !== undefined && <span className={cn('rounded px-1.5 text-[11px] tabular-nums', value === tab.value ? 'bg-rose-soft text-rose-dark' : 'bg-mist text-muted')}>{tab.count}</span>}
        </button>
      ))}
    </div>
  )
}

/** Pill-style segmented filter (status chips, date ranges) */
export function Segmented<V extends string>({ options, value, onChange, className, size = 'md' }: { options: { value: V; label: ReactNode }[]; value: V; onChange: (v: V) => void; className?: string; size?: 'sm' | 'md' }) {
  return (
    <div className={cn('no-scrollbar inline-flex max-w-full overflow-x-auto rounded-md border border-line bg-surface p-0.5', className)} role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn('shrink-0 rounded-[5px] font-medium whitespace-nowrap transition-colors', size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]', value === o.value ? 'bg-ink text-white' : 'text-muted hover:text-ink')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------------- Timeline ---------------- */

export interface TimelineItem {
  title: ReactNode
  description?: ReactNode
  time?: ReactNode
  tone?: 'done' | 'current' | 'upcoming' | 'error'
  icon?: ReactNode
}

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn('relative', className)}>
      {items.map((it, i) => {
        const tone = it.tone ?? 'done'
        return (
          <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
            {i < items.length - 1 && <span aria-hidden className={cn('absolute start-[11px] top-6 bottom-0 w-px', tone === 'upcoming' ? 'bg-line' : 'bg-ink/25')} />}
            <span
              className={cn(
                'relative z-10 mt-0.5 grid size-[23px] shrink-0 place-items-center rounded-full border text-[10px] [&>svg]:size-3',
                tone === 'done' && 'border-ink bg-ink text-white',
                tone === 'current' && 'border-rose bg-rose text-white ring-4 ring-rose/15',
                tone === 'upcoming' && 'border-line bg-surface text-subtle',
                tone === 'error' && 'border-error bg-error text-white',
              )}
            >
              {it.icon ?? (tone === 'upcoming' ? i + 1 : '✓')}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('text-[13px] font-medium', tone === 'upcoming' ? 'text-muted' : 'text-ink')}>{it.title}</p>
              {it.description && <p className="mt-0.5 text-xs text-muted">{it.description}</p>}
              {it.time && <p className="mt-0.5 text-[11.5px] text-subtle">{it.time}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/* ---------------- Key/value list ---------------- */

export function KeyValue({ items, className, cols = 1 }: { items: { label: ReactNode; value: ReactNode }[]; className?: string; cols?: 1 | 2 }) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-3', cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1', className)}>
      {items.map((it, i) => (
        <div key={i} className="flex min-w-0 items-baseline justify-between gap-4 text-[13px]">
          <dt className="shrink-0 text-muted">{it.label}</dt>
          <dd className="min-w-0 truncate text-end font-medium text-ink">{it.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ProgressBar({ value, tone = 'rose', className }: { value: number; tone?: 'rose' | 'success' | 'warning' | 'error' | 'dark'; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-mist', className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', tone === 'rose' && 'bg-rose', tone === 'success' && 'bg-success', tone === 'warning' && 'bg-warning', tone === 'error' && 'bg-error', tone === 'dark' && 'bg-ink')}
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  )
}

/* ---------------- States ---------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />
}

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: { label: string; to?: string; onClick?: () => void; icon?: ReactNode }; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-mist text-muted [&>svg]:size-5">{icon ?? <Inbox />}</span>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted">{description}</p>}
      {action &&
        (action.to ? (
          <ButtonLink to={action.to} size="sm" className="mt-5" icon={action.icon}>
            {action.label}
          </ButtonLink>
        ) : (
          <Button size="sm" onClick={action.onClick} className="mt-5" icon={action.icon}>
            {action.label}
          </Button>
        ))}
    </div>
  )
}

export function ErrorState({ onRetry, className, title }: { onRetry?: () => void; className?: string; title?: string }) {
  const { t } = useT()
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)} role="alert">
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-error-soft text-error">
        <AlertCircle className="size-5" />
      </span>
      <h3 className="text-[15px] font-semibold text-ink">{title ?? t('common.errorTitle')}</h3>
      <p className="mt-1 max-w-sm text-[13px] text-muted">{t('common.errorDesc')}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} className="mt-5">
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}

/** Generic page skeleton: header + stat row + a panel */
export function PageSkeleton({ stats = 4, rows = 6 }: { stats?: number; rows?: number }) {
  return (
    <div role="status" aria-label="Loading">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-3 h-7 w-64" />
      <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      {stats > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: stats }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}
      <div className="card mt-6 space-y-3 p-5">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    </div>
  )
}

/* ---------------- ChartCard ---------------- */

export function ChartCard({ title, description, actions, children, className, height = 280, loading }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; height?: number; loading?: boolean }) {
  return (
    <Card title={title} description={description} actions={actions} className={className}>
      <div style={{ height }} className="min-w-0 animate-fade-in" dir="ltr">
        {loading ? <Skeleton className="size-full" /> : children}
      </div>
    </Card>
  )
}
