import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BellOff, CheckCheck, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { NOTIFICATION_TYPES, NotificationItem } from '@/components/notifications/NotificationItem'
import { Button, ButtonLink, ConfirmDialog, EmptyState, ErrorState, PageHeader, Select, Skeleton, Tabs } from '@/components/ui'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { deleteNotification, getNotifications, markAllNotificationsRead, markNotificationRead } from '@/services/systemService'
import { useUnreadCount } from '@/store/notificationStore'
import type { AdminNotification } from '@/types'

const PAGE = 15
const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' })

export default function NotificationsPage() {
  const { t } = useT()
  useDocumentTitle(t('common.notifications'))
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'unread' ? 'unread' : 'all'
  const type = params.get('type') ?? ''
  const [limit, setLimit] = useState(PAGE)
  const [toDelete, setToDelete] = useState<AdminNotification | null>(null)
  const liveUnread = useUnreadCount()

  // Load the whole (type-filtered) feed once; tab counts + paging are derived locally
  const { data, loading, error, reload } = useAsync(() => getNotifications({ pageSize: 10000, filters: { type: type || undefined } }), [type, liveUnread])
  const all = data?.items
  const unreadCount = all?.filter((n) => !n.read).length ?? 0
  const list = useMemo(() => (all ?? []).filter((n) => tab === 'all' || !n.read), [all, tab])
  const visible = list.slice(0, limit)

  const groups = useMemo(() => {
    const today = dayKey(new Date())
    const yesterday = dayKey(new Date(Date.now() - 86400000))
    const g: { key: 'today' | 'yesterday' | 'earlier'; items: AdminNotification[] }[] = [
      { key: 'today', items: [] },
      { key: 'yesterday', items: [] },
      { key: 'earlier', items: [] },
    ]
    for (const n of visible) {
      const k = dayKey(new Date(n.date))
      g[k === today ? 0 : k === yesterday ? 1 : 2].items.push(n)
    }
    return g.filter((x) => x.items.length)
  }, [visible])

  const setParam = (k: string, v: string) => {
    setLimit(PAGE)
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        if (v) next.set(k, v)
        else next.delete(k)
        return next
      },
      { replace: true },
    )
  }

  const open = async (n: AdminNotification) => {
    if (!n.read) await markNotificationRead(n.id, true)
    if (n.href) navigate(n.href)
    else reload()
  }
  const toggleRead = async (n: AdminNotification) => {
    await markNotificationRead(n.id, !n.read)
    toast.success(n.read ? t('system.notifications.markedUnread') : t('system.notifications.markedRead'))
    reload()
  }
  const markAll = async () => {
    await markAllNotificationsRead()
    toast.success(t('system.notifications.allRead'))
    reload()
  }
  const doDelete = async () => {
    if (!toDelete) return
    await deleteNotification(toDelete.id)
    toast.success(t('system.notifications.deleted'))
    reload()
  }

  return (
    <>
      <PageHeader
        title={t('common.notifications')}
        description={t('system.notifications.description')}
        breadcrumbs={[{ label: t('common.notifications') }]}
        actions={
          <>
            <ButtonLink to="/settings/notifications" variant="outline" icon={<Settings2 className="size-4" />}>
              {t('system.notifications.preferences')}
            </ButtonLink>
            <Button onClick={markAll} disabled={unreadCount === 0} icon={<CheckCheck className="size-4" />}>
              {t('common.markAllRead')}
            </Button>
          </>
        }
      />
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line-soft px-4 pt-2 sm:flex-row sm:items-end sm:justify-between sm:px-5">
          <Tabs
            className="border-b-0"
            value={tab}
            onChange={(v) => setParam('tab', v === 'all' ? '' : v)}
            tabs={[
              { value: 'all', label: t('common.all'), count: all?.length },
              { value: 'unread', label: t('system.notifications.unreadTab'), count: all ? unreadCount : undefined },
            ]}
          />
          <div className="pb-3 sm:w-64">
            <Select
              aria-label={t('system.notifications.type')}
              value={type}
              onChange={(e) => setParam('type', e.target.value)}
              placeholder={t('system.notifications.allTypes')}
              options={NOTIFICATION_TYPES.map((x) => ({ value: x, label: t(`system.notifications.types.${x}`) }))}
            />
          </div>
        </div>

        {error ? (
          <ErrorState onRetry={reload} />
        ) : !all ? (
          <ul className="divide-y divide-line-soft" aria-busy>
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="flex gap-3 px-5 py-4">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </li>
            ))}
          </ul>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<BellOff />}
            title={tab === 'unread' ? t('common.noNotifications') : t('system.notifications.emptyTitle')}
            description={tab === 'unread' ? t('system.notifications.emptyUnreadDesc') : type ? t('system.notifications.emptyTypeDesc') : t('system.notifications.emptyDesc')}
            action={type || tab === 'unread' ? { label: t('system.notifications.showAll'), onClick: () => setParams({}, { replace: true }) } : undefined}
          />
        ) : (
          <div className={loading ? 'opacity-70 transition-opacity' : undefined}>
            {groups.map((g) => (
              <section key={g.key} aria-labelledby={`grp-${g.key}`}>
                <h2 id={`grp-${g.key}`} className="eyebrow border-b border-line-soft bg-ivory/70 px-4 py-2 sm:px-5">
                  {t(`system.notifications.groups.${g.key}`)}
                </h2>
                <ul className="divide-y divide-line-soft">
                  {g.items.map((n) => (
                    <NotificationItem key={n.id} n={n} onOpen={open} onToggleRead={toggleRead} onDelete={setToDelete} />
                  ))}
                </ul>
              </section>
            ))}
            <div className="flex flex-col items-center gap-2 border-t border-line-soft px-4 py-4 text-[13px] text-muted">
              <span className="tabular-nums">{t('common.showing', { from: 1, to: visible.length, total: list.length })}</span>
              {visible.length < list.length && (
                <Button variant="outline" size="sm" onClick={() => setLimit((l) => l + PAGE)}>
                  {t('system.notifications.loadMore')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={doDelete}
        title={t('system.notifications.deleteTitle')}
        description={t('system.notifications.deleteDesc', { title: toDelete?.title ?? '' })}
        confirmLabel={t('common.delete')}
      />
    </>
  )
}
