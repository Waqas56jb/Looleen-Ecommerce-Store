import { Link } from 'react-router-dom'
import { BadgeCheck, CreditCard, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { PAYMENT_METHODS, STORE_CONFIG } from '@/config/store'
import { useT } from '@/i18n'
import { cn } from '@/utils'

/* --------------------------------------------------------------------------
   Logo — text wordmark styled after the client's LOOKS logo (high-contrast
   serif, interlocking O's, bronze tone, "ALL ABOUT YOU" tagline).
   Replace this single component with an <img> when the vector logo arrives.
   -------------------------------------------------------------------------- */

export function Logo({ className, tone = 'bronze', showTagline = true }: { className?: string; tone?: 'bronze' | 'light' | 'dark'; showTagline?: boolean }) {
  const name = STORE_CONFIG.name
  const [first, ...rest] = name.split('')
  const oo = name.toUpperCase() === 'LOOKS'
  return (
    <Link to="/" aria-label={`${name} — ${STORE_CONFIG.tagline}`} className={cn('group inline-flex flex-col items-center leading-none', className)} dir="ltr">
      <span
        className={cn(
          'font-serif text-[28px] font-medium tracking-[0.06em] sm:text-[32px]',
          tone === 'bronze' && 'wordmark-gradient',
          tone === 'light' && 'text-ivory',
          tone === 'dark' && 'text-ink',
        )}
        style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
      >
        {oo ? (
          <>
            L<span className="inline-block">O</span>
            <span className="-ms-[0.2em] inline-block">O</span>KS
          </>
        ) : (
          <>
            {first}
            {rest.join('')}
          </>
        )}
      </span>
      {showTagline && (
        <span className={cn('mt-0.5 text-[7.5px] font-medium tracking-[0.42em] uppercase sm:text-[8px]', tone === 'light' ? 'text-ivory/70' : 'text-ink/70')}>
          {STORE_CONFIG.tagline}
        </span>
      )}
    </Link>
  )
}

/* ---------------- Trust system ---------------- */

export function OriginalBadge({ className, size = 'sm' }: { className?: string; size?: 'sm' | 'md' }) {
  const { t } = useT()
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full bg-white/95 font-semibold text-ink backdrop-blur', size === 'sm' ? 'h-6 px-2 text-[10.5px]' : 'h-8 px-3 text-xs', className)}>
      <ShieldCheck className={cn('text-success', size === 'sm' ? 'size-3.5' : 'size-4')} aria-hidden />
      {t('common.original')}
    </span>
  )
}

export function AuthorizedBadge({ className, size = 'sm' }: { className?: string; size?: 'sm' | 'md' }) {
  const { t } = useT()
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full bg-champagne-soft font-semibold text-[#6e5226]', size === 'sm' ? 'h-6 px-2 text-[10.5px]' : 'h-8 px-3 text-xs', className)}>
      <BadgeCheck className={cn(size === 'sm' ? 'size-3.5' : 'size-4')} aria-hidden />
      {t('common.authorized')}
    </span>
  )
}

/** Inline authenticity callout for product pages and checkout */
export function AuthenticityMessage({ className, compact }: { className?: string; compact?: boolean }) {
  const { t } = useT()
  return (
    <div className={cn('flex gap-3 rounded-xs border border-champagne/40 bg-champagne-soft/40 p-4', className)}>
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
      <div>
        <p className="text-sm font-semibold text-ink">{t('common.originalAuthorized')}</p>
        {!compact && <p className="mt-1 text-[13px] leading-relaxed text-muted">{t('trust.authenticityBody')}</p>}
      </div>
    </div>
  )
}

const TRUST_ITEMS = [
  { icon: ShieldCheck, title: 'trust.original', desc: 'trust.originalDesc' },
  { icon: BadgeCheck, title: 'trust.authorized', desc: 'trust.authorizedDesc' },
  { icon: Truck, title: 'trust.delivery', desc: 'trust.deliveryDesc' },
  { icon: CreditCard, title: 'trust.secure', desc: 'trust.secureDesc' },
  { icon: RotateCcw, title: 'trust.returns', desc: 'trust.returnsDesc' },
]

/** Four (or five) trust pillars. `variant="strip"` is a compact single row for category pages. */
export function TrustBar({ variant = 'full', className, count = 4 }: { variant?: 'full' | 'strip'; className?: string; count?: 4 | 5 }) {
  const { t } = useT()
  const items = TRUST_ITEMS.slice(0, count)
  if (variant === 'strip') {
    return (
      <div className={cn('no-scrollbar flex gap-6 overflow-x-auto border-y border-line py-3 text-xs text-muted sm:justify-center sm:gap-10', className)}>
        {items.map(({ icon: Icon, title }) => (
          <span key={title} className="flex shrink-0 items-center gap-2">
            <Icon className="size-4 text-rose" aria-hidden />
            {t(title)}
          </span>
        ))}
      </div>
    )
  }
  return (
    <ul className={cn('grid grid-cols-2 gap-px overflow-hidden rounded-xs border border-line bg-line lg:grid-cols-4', count === 5 && 'lg:grid-cols-5', className)}>
      {items.map(({ icon: Icon, title, desc }) => (
        <li key={title} className="flex flex-col items-center gap-3 bg-ivory px-4 py-6 text-center sm:flex-row sm:items-start sm:text-start lg:px-6 lg:py-7">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blush text-rose">
            <Icon className="size-5" strokeWidth={1.6} aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">{t(title)}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted">{t(desc)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

/* ---------------- Payment marks ---------------- */

const PAY_STYLE: Record<string, string> = {
  mada: 'text-[#1f6f43]',
  visa: 'text-[#1a1f71] italic font-extrabold',
  mastercard: 'text-[#eb001b]',
  applepay: 'text-ink',
  stcpay: 'text-[#4f008c]',
  tabby: 'text-[#3bb08f]',
  tamara: 'text-[#b8693b]',
  cod: 'text-muted',
}

/** Text-based payment marks (no third-party logo assets are bundled) */
export function PaymentMark({ id, className }: { id: string; className?: string }) {
  const { lang } = useT()
  const m = PAYMENT_METHODS.find((p) => p.id === id)
  if (!m) return null
  return (
    <span className={cn('inline-flex h-7 min-w-12 items-center justify-center rounded-[4px] border border-line bg-white px-2 text-[11px] font-bold tracking-tight', PAY_STYLE[id], className)}>
      {lang === 'ar' ? m.labelAr : m.label}
    </span>
  )
}

export function PaymentMarks({ className, include = ['mada', 'visa', 'mastercard', 'applepay', 'stcpay', 'tabby', 'tamara'] }: { className?: string; include?: string[] }) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {include.map((id) => (
        <PaymentMark key={id} id={id} />
      ))}
    </div>
  )
}
