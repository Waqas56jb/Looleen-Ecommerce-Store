import { AlertTriangle, Bell, Megaphone, MessageSquareMore, PackageCheck, RotateCcw, ShoppingBag, Trash2, UserPlus, MailOpen, Mail, type LucideIcon } from 'lucide-react'
import { Dropdown, IconButton } from '@/components/ui'
import { useT } from '@/i18n'
import type { AdminNotification, NotificationType } from '@/types'
import { cn, formatDateTime, timeAgo } from '@/utils'
import { MoreHorizontal } from 'lucide-react'

export const NOTIFICATION_TYPES: Exclude<NotificationType, 'system'>[] = ['new_order', 'low_stock', 'new_customer', 'return_request', 'review_pending', 'campaign_ending', 'order_update']

export const NOTIFICATION_META: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  new_order: { icon: ShoppingBag, className: 'bg-success-soft text-success' },
  low_stock: { icon: AlertTriangle, className: 'bg-warning-soft text-warning' },
  new_customer: { icon: UserPlus, className: 'bg-info-soft text-info' },
  return_request: { icon: RotateCcw, className: 'bg-error-soft text-error' },
  review_pending: { icon: MessageSquareMore, className: 'bg-champagne-soft text-[#7a5a26]' },
  campaign_ending: { icon: Megaphone, className: 'bg-rose-soft text-rose-dark' },
  order_update: { icon: PackageCheck, className: 'bg-mist text-ink' },
  system: { icon: Bell, className: 'bg-mist text-muted' },
}

interface Props {
  n: AdminNotification
  onOpen: (n: AdminNotification) => void
  onToggleRead: (n: AdminNotification) => void
  onDelete: (n: AdminNotification) => void
}

export function NotificationItem({ n, onOpen, onToggleRead, onDelete }: Props) {
  const { t, lang } = useT()
  const meta = NOTIFICATION_META[n.type] ?? NOTIFICATION_META.system
  const Icon = meta.icon
  return (
    <li className={cn('group relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-mist/70 sm:px-5', !n.read && 'bg-rose-soft/30')}>
      <button type="button" onClick={() => onOpen(n)} className="flex min-w-0 flex-1 gap-3 text-start outline-none focus-visible:ring-2 focus-visible:ring-rose/30 rounded-md">
        <span className={cn('relative mt-0.5 grid size-9 shrink-0 place-items-center rounded-full', meta.className)}>
          <Icon className="size-4" aria-hidden />
          {!n.read && <span className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full border-2 border-surface bg-rose" aria-label={t('system.notifications.unread')} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className={cn('text-[13.5px] text-ink', !n.read ? 'font-semibold' : 'font-medium')}>{n.title}</span>
            <span className="text-[11px] text-subtle">{t(`system.notifications.types.${n.type}`)}</span>
          </span>
          <span className="mt-0.5 line-clamp-2 block text-[13px] text-muted">{n.body}</span>
          <time dateTime={n.date} title={formatDateTime(n.date, lang)} className="mt-1 block text-[11.5px] text-subtle">
            {timeAgo(n.date, lang)}
          </time>
        </span>
      </button>
      <div className="flex shrink-0 items-start gap-0.5">
        <IconButton label={n.read ? t('system.notifications.markUnread') : t('system.notifications.markRead')} size="sm" onClick={() => onToggleRead(n)} className="max-sm:hidden">
          {n.read ? <Mail /> : <MailOpen />}
        </IconButton>
        <IconButton label={t('common.delete')} size="sm" variant="danger" onClick={() => onDelete(n)} className="max-sm:hidden">
          <Trash2 />
        </IconButton>
        <div className="sm:hidden">
          <Dropdown
            trigger={({ toggle }) => (
              <IconButton label={t('common.actions')} size="sm" onClick={toggle}>
                <MoreHorizontal />
              </IconButton>
            )}
            items={[
              { label: n.read ? t('system.notifications.markUnread') : t('system.notifications.markRead'), icon: n.read ? <Mail /> : <MailOpen />, onClick: () => onToggleRead(n) },
              { label: t('common.delete'), icon: <Trash2 />, danger: true, onClick: () => onDelete(n) },
            ]}
          />
        </div>
      </div>
    </li>
  )
}
