import { X } from 'lucide-react'
import { Card, Timeline, type TimelineItem } from '@/components/ui'
import { useT } from '@/i18n'
import { RETURN_FLOW } from '@/services/moderationService'
import type { ReturnRequest } from '@/types'
import { formatDateTime } from '@/utils'

export function ReturnTimelineCard({ ret }: { ret: ReturnRequest }) {
  const { t, lang } = useT()
  const latest = (s: string) => [...ret.timeline].reverse().find((e) => e.status === s)
  const rejected = ret.status === 'rejected'
  const reached = rejected ? Math.max(0, ...RETURN_FLOW.map((s, i) => (latest(s) ? i : 0))) : RETURN_FLOW.indexOf(ret.status)
  const finished = ret.status === 'refunded'

  const desc = (e?: ReturnRequest['timeline'][number]) =>
    e && (
      <>
        {t('orders.returns.detail.by', { name: e.by })}
        {e.note && <span className="mt-0.5 block text-ink/80">“{e.note}”</span>}
      </>
    )

  const items: TimelineItem[] = RETURN_FLOW.filter((_, i) => !rejected || i <= reached).map((s, i) => {
    const e = latest(s)
    return {
      title: t(`status.${s}`),
      description: desc(e),
      time: e ? formatDateTime(e.date, lang) : undefined,
      tone: i < reached || finished || rejected ? 'done' : i === reached ? 'current' : 'upcoming',
    }
  })
  if (rejected) {
    const e = latest('rejected')
    items.push({ title: t('status.rejected'), description: desc(e), time: e ? formatDateTime(e.date, lang) : undefined, tone: 'error', icon: <X /> })
  }
  return (
    <Card title={t('orders.returns.detail.timeline')}>
      <Timeline items={items} />
    </Card>
  )
}
