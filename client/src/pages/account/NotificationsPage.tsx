import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellOff, CheckCheck, Lightbulb, Package, Sparkles, Tag, X, type LucideIcon } from 'lucide-react'
import { AccountPageHeader, FilterChips, relativeTime } from '@/components/account/AccountUI'
import { Button, EmptyState, IconButton } from '@/components/common'
import { useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { useAccountStore } from '@/store/account'
import type { NotificationItem } from '@/types'
import { cn, formatDateTime } from '@/utils'

const ICONS: Record<NotificationItem['type'], LucideIcon> = {
  order: Package,
  offer: Tag,
  new_arrival: Sparkles,
  tip: Lightbulb,
}

export default function NotificationsPage() {
  const { t, l, lang } = useT()
  useDocumentMeta(t('account.notifications.metaTitle'), t('account.notifications.metaDesc'))
  const navigate = useNavigate()
  const notifications = useAccountStore((s) => s.notifications)
  const markRead = useAccountStore((s) => s.markNotificationRead)
  const markAll = useAccountStore((s) => s.markAllNotificationsRead)
  const remove = useAccountStore((s) => s.deleteNotification)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const unread = notifications.filter((n) => !n.read).length
  const visible = [...notifications].filter((n) => filter === 'all' || !n.read).sort((a, b) => b.date.localeCompare(a.date))

  const open = (n: NotificationItem) => {
    markRead(n.id)
    if (n.href) navigate(n.href)
  }

  return (
    <div>
      <AccountPageHeader
        title={t('account.notifications.title')}
        description={t('account.notifications.desc')}
        action={
          unread > 0 && (
            <Button variant="outline" size="sm" onClick={markAll} icon={<CheckCheck className="size-4" />}>
              {t('account.notifications.markAll')}
            </Button>
          )
        }
      />

      {notifications.length > 0 && (
        <FilterChips
          className="mb-6"
          label={t('account.notifications.title')}
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: t('account.notifications.all'), count: notifications.length },
            { id: 'unread', label: t('account.notifications.unread'), count: unread },
          ]}
        />
      )}

      {visible.length === 0 ? (
        <div className="rounded-xs border border-line bg-white">
          <EmptyState icon={<BellOff />} title={t('empty.notificationsTitle')} description={t('empty.notificationsDesc')} />
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((n) => {
            const Icon = ICONS[n.type]
            return (
              <li key={n.id} className={cn('group relative flex gap-4 rounded-xs border bg-white p-4 transition-shadow hover:shadow-soft sm:p-5', n.read ? 'border-line' : 'border-rose/40')}>
                <span className={cn('grid size-11 shrink-0 place-items-center rounded-full', n.read ? 'bg-mist text-muted' : 'bg-blush text-rose')}>
                  <Icon className="size-5" strokeWidth={1.6} aria-hidden />
                </span>
                <button type="button" onClick={() => open(n)} className="min-w-0 flex-1 text-start after:absolute after:inset-0 after:content-['']">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                    <span className="font-semibold tracking-wide text-rose uppercase">{t(`account.notifications.types.${n.type}`)}</span>
                    <span aria-hidden>·</span>
                    <time dateTime={n.date} title={formatDateTime(n.date, lang)}>
                      {relativeTime(n.date, lang)}
                    </time>
                  </span>
                  <span className={cn('mt-1 flex items-center gap-2 text-[15px] text-ink', !n.read && 'font-semibold')}>
                    {!n.read && (
                      <span className="size-2 shrink-0 rounded-full bg-rose">
                        <span className="sr-only">{t('account.notifications.unreadDot')}</span>
                      </span>
                    )}
                    {l(n.title)}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">{l(n.body)}</span>
                </button>
                <IconButton label={t('account.notifications.delete')} size="sm" onClick={() => remove(n.id)} className="relative z-10 -me-1 -mt-1 text-muted hover:text-ink">
                  <X className="size-4" />
                </IconButton>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
