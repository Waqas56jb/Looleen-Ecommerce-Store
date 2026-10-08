import { useState, type ImgHTMLAttributes, type ReactNode } from 'react'
import { Money } from './Money'
import { Link } from 'react-router-dom'
import { ChevronRight, Loader2, Star } from 'lucide-react'
import { img } from '@/data/images'
import { useInView } from '@/hooks'
import { useT } from '@/i18n'
import { cn, formatPrice } from '@/utils'

/* --------------------------------------------------------------------------
   SmartImage — Unsplash-aware image with lazy loading, fade-in and a
   graceful branded fallback instead of the broken-image icon.
   `src` may be a pool id ("photo-…") or a full URL.
   -------------------------------------------------------------------------- */

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string
  alt: string
  /** Requested width in px (for Unsplash ids) */
  width?: number
  /** Optional crop height in px (for Unsplash ids) */
  height?: number
  priority?: boolean
  wrapperClassName?: string
}

export function SmartImage({ src, alt, width = 800, height, priority, className, wrapperClassName, ...rest }: SmartImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const url = src.startsWith('photo-') ? img(src, width, height) : src
  return (
    <span className={cn(!/(absolute|fixed)/.test(wrapperClassName ?? '') && 'relative', 'block overflow-hidden bg-blush/60', wrapperClassName)}>
      {!failed ? (
        <img
          src={url}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn('size-full object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0', className)}
          {...rest}
        />
      ) : (
        <span role="img" aria-label={alt} className="absolute inset-0 grid place-items-center bg-gradient-to-br from-blush to-champagne-soft">
          <span className="font-serif text-2xl tracking-[0.3em] text-ink/30">LOOKS</span>
        </span>
      )}
      {!loaded && !failed && <span className="skeleton absolute inset-0" aria-hidden />}
    </span>
  )
}

/* ---------------- Badge ---------------- */

type BadgeTone = 'rose' | 'ink' | 'champagne' | 'outline' | 'success' | 'muted' | 'white' | 'error' | 'warning'

const badgeTones: Record<BadgeTone, string> = {
  rose: 'bg-rose text-white',
  ink: 'bg-ink text-ivory',
  champagne: 'bg-champagne-soft text-[#7a5a2a]',
  outline: 'border border-ink/20 text-ink bg-white/70',
  success: 'bg-success/10 text-success',
  muted: 'bg-mist text-muted',
  white: 'bg-white/90 text-ink backdrop-blur',
  error: 'bg-error/10 text-error',
  warning: 'bg-warning/10 text-warning',
}

export function Badge({ tone = 'rose', children, className, icon }: { tone?: BadgeTone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span className={cn('inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold tracking-wide whitespace-nowrap', badgeTones[tone], className)}>
      {icon}
      {children}
    </span>
  )
}

/* ---------------- RatingStars ---------------- */

export function RatingStars({ rating, size = 14, className, showValue, count }: { rating: number; size?: number; className?: string; showValue?: boolean; count?: number }) {
  const { t } = useT()
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative inline-flex" role="img" aria-label={`${rating.toFixed(1)} / 5`}>
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
      {showValue && <span className="text-xs font-semibold text-ink">{rating.toFixed(1)}</span>}
      {count !== undefined && <span className="text-xs text-muted">({count.toLocaleString('en-US')})</span>}
      {count !== undefined && <span className="sr-only">{t('common.reviewsCount', { count })}</span>}
    </span>
  )
}

/** Interactive star picker for review forms */
export function RatingInput({ value, onChange, size = 28 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} / 5`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="rounded-xs p-0.5 transition-transform hover:scale-110"
        >
          <Star style={{ width: size, height: size }} className={(hover || value) >= n ? 'text-champagne' : 'text-line'} fill="currentColor" strokeWidth={0} />
        </button>
      ))}
    </div>
  )
}

/* ---------------- Price ---------------- */

export function Price({ price, compareAtPrice, size = 'md', className }: { price: number; compareAtPrice?: number; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const { lang } = useT()
  const onSale = compareAtPrice && compareAtPrice > price
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2', className)}>
      <span className={cn('font-semibold tabular-nums', onSale ? 'text-rose' : 'text-ink', size === 'sm' && 'text-sm', size === 'md' && 'text-[15px]', size === 'lg' && 'text-2xl')}>
        <Money value={price} />
      </span>
      {onSale && (
        <s className={cn('text-muted tabular-nums', size === 'lg' ? 'text-base' : 'text-xs')} aria-label={`was ${formatPrice(compareAtPrice, lang)}`}>
          <Money value={compareAtPrice} />
        </s>
      )}
    </span>
  )
}

/* ---------------- Headings ---------------- */

interface SectionHeadingProps {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  align?: 'start' | 'center'
  className?: string
  as?: 'h1' | 'h2' | 'h3'
  tone?: 'dark' | 'light'
}

export function SectionHeading({ eyebrow, title, description, action, align = 'start', className, as: H = 'h2', tone = 'dark' }: SectionHeadingProps) {
  return (
    <div className={cn('mb-8 flex flex-col gap-4 sm:mb-10', align === 'center' ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className={cn('eyebrow mb-3', tone === 'light' && 'text-champagne')}>{eyebrow}</p>}
        <H className={cn('heading-section text-balance', tone === 'light' && 'text-ivory')}>{title}</H>
        {description && <p className={cn('mt-3 text-[15px] leading-relaxed', tone === 'light' ? 'text-ivory/70' : 'text-muted')}>{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** "View all →" text link used in section headers */
export function ArrowLink({ to, children, className, tone = 'dark' }: { to: string; children: ReactNode; className?: string; tone?: 'dark' | 'light' }) {
  return (
    <Link to={to} className={cn('group inline-flex items-center gap-1.5 text-sm font-medium', tone === 'light' ? 'text-ivory' : 'text-ink', className)}>
      <span className="link-underline">{children}</span>
      <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
    </Link>
  )
}

/* ---------------- Breadcrumbs ---------------- */

export function Breadcrumbs({ items, className }: { items: { label: string; to?: string }[]; className?: string }) {
  const { t } = useT()
  const all = [{ label: t('common.home'), to: '/' }, ...items]
  return (
    <nav aria-label="Breadcrumb" className={cn('text-xs text-muted', className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {all.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3 opacity-60 rtl:-scale-x-100" aria-hidden />}
            {item.to && i < all.length - 1 ? (
              <Link to={item.to} className="transition-colors hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span aria-current={i === all.length - 1 ? 'page' : undefined} className="text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/* ---------------- Reveal (fade-up on scroll) ---------------- */

export function Reveal({ children, className, delay = 0, as: Tag = 'div' }: { children: ReactNode; className?: string; delay?: number; as?: 'div' | 'section' | 'li' }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <Tag
      ref={ref as never}
      className={cn(inView ? 'animate-fade-up' : 'opacity-0', className)}
      style={inView && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}

/* ---------------- Misc ---------------- */

export function LoadingSpinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-3 py-16 text-muted', className)} role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="text-sm">{label ?? 'Loading…'}</span>
    </div>
  )
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-line', className)} />
}

/** Thin progress bar (free-shipping meter etc.) */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-blush', className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-gradient-to-r from-champagne to-rose transition-[width] duration-500 ease-out" style={{ width: `${Math.max(4, value * 100)}%` }} />
    </div>
  )
}
