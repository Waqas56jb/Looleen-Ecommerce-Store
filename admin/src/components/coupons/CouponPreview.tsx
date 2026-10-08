import type { ReactNode } from 'react'
import { CalendarDays, Layers, ShoppingBag, Ticket, Users } from 'lucide-react'
import { Money, StatusBadge } from '@/components/ui'
import { useT } from '@/i18n'
import type { CouponStatus, CouponType, CustomerSegment } from '@/types'
import { cn, formatDate, formatNumber } from '@/utils'

export interface CouponPreviewData {
  code: string
  description: string
  type: CouponType
  value: number
  minOrder: number
  maxDiscount?: number
  usageLimit?: number
  perCustomerLimit?: number
  startDate?: string
  endDate?: string
  restricted: boolean
  segment: CustomerSegment
  status: CouponStatus
}

/** Ticket-style coupon card shown next to the coupon form */
export function CouponPreview({ data }: { data: CouponPreviewData }) {
  const { t, lang } = useT()
  const P = (k: string, v?: Record<string, string | number>) => t(`marketing.couponForm.preview.${k}`, v)
  const headline =
    data.type === 'percentage' ? (
      <span dir="ltr">{data.value || 0}%</span>
    ) : data.type === 'fixed' ? (
      <Money value={data.value || 0} />
    ) : (
      <Ticket className="size-9" strokeWidth={1.4} aria-hidden />
    )
  const sub = data.type === 'percentage' ? t('marketing.shared.off').toUpperCase() : data.type === 'fixed' ? P('offFixed') : P('freeShipping')

  const conditions: { icon: ReactNode; text: ReactNode }[] = [
    {
      icon: <ShoppingBag />,
      text:
        data.minOrder > 0 ? (
          <>
            {P('minOrder')} <Money value={data.minOrder} className="font-medium text-ink" />
          </>
        ) : (
          P('noMinimum')
        ),
    },
  ]
  if (data.type === 'percentage' && data.maxDiscount)
    conditions.push({
      icon: <Ticket />,
      text: (
        <>
          {P('upTo')} <Money value={data.maxDiscount} className="font-medium text-ink" />
        </>
      ),
    })
  conditions.push({ icon: <Layers />, text: data.restricted ? P('restricted') : P('everything') })
  conditions.push({ icon: <Users />, text: t(`marketing.shared.segments.${data.segment}`) })
  conditions.push({
    icon: <CalendarDays />,
    text: data.startDate && data.endDate ? P('validity', { from: formatDate(data.startDate, lang), to: formatDate(data.endDate, lang) }) : P('datesTbd'),
  })

  return (
    <div className="relative">
      <div className="flex overflow-hidden rounded-lg border border-line bg-surface shadow-card">
        {/* Value stub */}
        <div className="relative flex w-[38%] shrink-0 flex-col items-center justify-center gap-1 bg-ink px-3 py-6 text-center text-white">
          <span className="text-[10px] font-semibold tracking-[0.2em] text-champagne uppercase">LOOKS</span>
          <span className="font-serif text-4xl leading-none font-semibold tabular-nums [&_svg]:h-[0.72em]">{headline}</span>
          <span className="text-[11px] font-semibold tracking-[0.18em] text-white/80">{sub}</span>
        </div>
        {/* Perforation */}
        <div className="relative w-0 border-s-2 border-dashed border-line" aria-hidden>
          <span className="absolute -top-2.5 -start-2.5 size-5 rounded-full border border-line bg-ivory" />
          <span className="absolute -bottom-2.5 -start-2.5 size-5 rounded-full border border-line bg-ivory" />
        </div>
        {/* Details */}
        <div className="min-w-0 flex-1 space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <span className="rounded-md border border-dashed border-ink/30 bg-mist px-2 py-1 font-mono text-sm font-bold tracking-widest text-ink" dir="ltr">
              {data.code || P('codePlaceholder')}
            </span>
            <StatusBadge status={data.status} />
          </div>
          {data.description && <p className="line-clamp-2 text-xs text-muted">{data.description}</p>}
          <ul className="space-y-1.5">
            {conditions.map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-muted [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-subtle">
                {c.icon}
                <span className="min-w-0">{c.text}</span>
              </li>
            ))}
          </ul>
          <p className={cn('border-t border-line-soft pt-2 text-[11px] text-subtle')}>
            {data.perCustomerLimit === 1 ? P('oncePerCustomer') : data.perCustomerLimit ? P('perCustomer', { count: data.perCustomerLimit }) : null}
            {data.perCustomerLimit && data.usageLimit ? ' · ' : null}
            {data.usageLimit ? P('usesTotal', { count: formatNumber(data.usageLimit) }) : null}
            {!data.perCustomerLimit && !data.usageLimit ? t('marketing.shared.unlimited') : null}
          </p>
        </div>
      </div>
    </div>
  )
}
