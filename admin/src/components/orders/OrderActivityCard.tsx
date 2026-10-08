import { Activity } from 'lucide-react'
import { Card, Skeleton } from '@/components/ui'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getActivity } from '@/services/systemService'
import { formatDateTime, timeAgo } from '@/utils'

/** Activity log entries for a single entity (order / return) */
export function EntityActivityCard({ entity, entityId, version, title, emptyText }: { entity: 'order' | 'return'; entityId: string; version?: string; title?: string; emptyText?: string }) {
  const { t, lang } = useT()
  const { data, loading } = useAsync(async () => (await getActivity({ filters: { entity }, pageSize: 10000 })).items.filter((a) => a.entityId === entityId).slice(0, 15), [entity, entityId, version])
  return (
    <Card title={title ?? t('orders.detail.activity')}>
      {loading && !data ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : !data?.length ? (
        <p className="flex items-center gap-2 text-[13px] text-muted">
          <Activity className="size-4 text-subtle" aria-hidden /> {emptyText ?? t('orders.detail.noActivity')}
        </p>
      ) : (
        <ul className="space-y-3">
          {data.map((a) => (
            <li key={a.id} className="flex gap-3 text-[13px]">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink/40" aria-hidden />
              <div className="min-w-0">
                <p className="text-ink">{a.description}</p>
                <p className="mt-0.5 text-xs text-subtle" title={formatDateTime(a.date, lang)}>
                  {a.userName} · {timeAgo(a.date, lang)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
