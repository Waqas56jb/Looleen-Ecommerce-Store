import { Check, X } from 'lucide-react'
import { Badge } from '@/components/common'
import { useT } from '@/i18n'
import type { OrderStatus, OrderTimelineStep } from '@/types'
import { cn, formatDateTime } from '@/utils'

const TONE: Record<OrderStatus, 'muted' | 'warning' | 'champagne' | 'ink' | 'rose' | 'success' | 'error'> = {
  processing: 'warning',
  confirmed: 'champagne',
  packed: 'champagne',
  shipped: 'ink',
  out_for_delivery: 'rose',
  delivered: 'success',
  cancelled: 'error',
}

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const { t } = useT()
  return (
    <Badge tone={TONE[status]} className={className}>
      {t(`status.${status}`)}
    </Badge>
  )
}

/** Vertical tracking timeline (placed → delivered). Horizontal on md+ when `horizontal` */
export function OrderTimeline({ steps, horizontal }: { steps: OrderTimelineStep[]; horizontal?: boolean }) {
  const { t, lang } = useT()
  const currentIdx = steps.reduce((acc, s, i) => (s.done ? i : acc), 0)
  return (
    <ol className={cn('relative', horizontal ? 'grid gap-6 md:grid-flow-col md:auto-cols-fr md:gap-0' : 'space-y-0')}>
      {steps.map((s, i) => {
        const cancelled = s.status === 'cancelled'
        const isCurrent = i === currentIdx
        const last = i === steps.length - 1
        return (
          <li key={`${s.status}-${i}`} className={cn('relative flex gap-4', horizontal ? 'md:flex-col md:items-center md:text-center' : 'pb-7 last:pb-0')}>
            {!last && (
              <span
                aria-hidden
                className={cn(
                  'absolute',
                  horizontal ? 'start-[15px] top-8 bottom-[-24px] w-px md:start-[50%] md:top-[15px] md:right-auto md:bottom-auto md:h-px md:w-full' : 'start-[15px] top-8 bottom-0 w-px',
                  steps[i + 1]?.done ? 'bg-ink' : 'bg-line',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 grid size-8 shrink-0 place-items-center rounded-full border text-xs',
                cancelled ? 'border-error bg-error text-white' : s.done ? 'border-ink bg-ink text-ivory' : 'border-line bg-white text-muted',
                isCurrent && !cancelled && 'ring-4 ring-rose/20',
              )}
            >
              {cancelled ? <X className="size-4" /> : s.done ? <Check className="size-4" /> : i + 1}
            </span>
            <div className={cn('pt-1', horizontal && 'md:pt-3')}>
              <p className={cn('text-sm font-medium', s.done ? 'text-ink' : 'text-muted')}>{t(`status.${s.status}`)}</p>
              {s.date && <p className="mt-0.5 text-xs text-muted">{formatDateTime(s.date, lang)}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
