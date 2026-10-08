import { X } from 'lucide-react'
import { Card, Timeline, type TimelineItem } from '@/components/ui'
import { useT } from '@/i18n'
import { ORDER_FLOW } from '@/services/orderService'
import type { AdminOrder, OrderEvent } from '@/types'
import { formatDateTime } from '@/utils'

const STEPS = ['placed', ...ORDER_FLOW.slice(1)] as const

export function OrderTimelineCard({ order }: { order: AdminOrder }) {
  const { t, lang } = useT()
  const latest = (status: string): OrderEvent | undefined => [...order.timeline].reverse().find((e) => e.status === status)
  const ended = order.status === 'cancelled' || order.status === 'refunded'
  // Index of the step reached (pending → "placed")
  const reached = ended
    ? Math.max(0, ...STEPS.map((s, i) => (latest(s) ? i : 0)))
    : Math.max(0, STEPS.indexOf((order.status === 'pending' ? 'placed' : order.status) as (typeof STEPS)[number]))
  const isDone = !ended && order.status === 'delivered'

  const detail = (e?: OrderEvent) =>
    e && (
      <>
        {t('orders.detail.by', { name: e.by })}
        {e.note && <span className="mt-0.5 block text-ink/80">“{e.note}”</span>}
      </>
    )

  const items: TimelineItem[] = STEPS.filter((_, i) => !ended || i <= reached).map((s, i) => {
    const e = latest(s)
    const tone: TimelineItem['tone'] = i < reached || isDone || ended ? 'done' : i === reached ? 'current' : 'upcoming'
    return { title: t(`status.${s}`), description: detail(e), time: e ? formatDateTime(e.date, lang) : undefined, tone }
  })
  if (ended) {
    const e = latest(order.status)
    items.push({ title: t(`status.${order.status}`), description: detail(e), time: e ? formatDateTime(e.date, lang) : undefined, tone: 'error', icon: <X /> })
  }

  return (
    <Card title={t('orders.detail.timeline')}>
      <Timeline items={items} />
    </Card>
  )
}
