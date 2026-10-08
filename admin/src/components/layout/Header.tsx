import { Link, useNavigate } from 'react-router-dom'
import { Bell, CircleHelp, Globe, LogOut, Menu, Search, Settings, UserCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useT } from '@/i18n'
import { logout } from '@/services/authService'
import { markAllNotificationsRead, markNotificationRead } from '@/services/systemService'
import { useAuthStore } from '@/store/authStore'
import { useLatestNotifications, useUnreadCount } from '@/store/notificationStore'
import { useUIStore } from '@/store/uiStore'
import { cn, timeAgo } from '@/utils'
import { Avatar, Dropdown, IconButton, Modal } from '@/components/ui'
import { useState } from 'react'
import { AdminLogo } from './Sidebar'

function NotificationBell() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const unread = useUnreadCount()
  const latest = useLatestNotifications(7)
  return (
    <Dropdown
      widthClass="w-[min(380px,calc(100vw-24px))]"
      trigger={({ toggle, open }) => (
        <IconButton label={`${t('common.notifications')} (${unread})`} onClick={toggle} aria-expanded={open}>
          <Bell className="size-[18px]!" />
          {unread > 0 && <span className="absolute end-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose px-1 text-[9.5px] font-semibold text-white tabular-nums">{unread > 99 ? '99+' : unread}</span>}
        </IconButton>
      )}
    >
      <div className="flex items-center justify-between border-b border-line-soft px-4 py-2.5">
        <p className="text-sm font-semibold text-ink">{t('common.notifications')}</p>
        {unread > 0 && (
          <button type="button" onClick={() => markAllNotificationsRead()} className="text-xs font-medium text-rose hover:underline">
            {t('common.markAllRead')}
          </button>
        )}
      </div>
      <ul className="thin-scrollbar max-h-96 overflow-y-auto">
        {latest.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted">{t('common.noNotifications')}</li>}
        {latest.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => {
                markNotificationRead(n.id)
                if (n.href) navigate(n.href)
              }}
              className={cn('flex w-full gap-3 border-b border-line-soft px-4 py-3 text-start transition-colors last:border-0 hover:bg-mist', !n.read && 'bg-rose-soft/40')}
            >
              <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-rose')} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink">{n.title}</span>
                <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{n.body}</span>
                <span className="mt-1 block text-[11px] text-subtle">{timeAgo(n.date, lang)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Link to="/notifications" className="block border-t border-line-soft px-4 py-2.5 text-center text-[13px] font-medium text-ink hover:bg-mist">
        {t('common.viewAll')}
      </Link>
    </Dropdown>
  )
}

function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useT()
  const L = (en: string, ar: string) => (lang === 'ar' ? ar : en)
  const rows: [string, string][] = [
    ['Ctrl / ⌘ + K', L('Open command palette & global search', 'فتح لوحة الأوامر والبحث الشامل')],
    ['Esc', L('Close dialogs and menus', 'إغلاق النوافذ والقوائم')],
    ['Enter', L('Open the focused table row', 'فتح الصف المحدد في الجدول')],
  ]
  return (
    <Modal open={open} onClose={onClose} title={L('Help & shortcuts', 'المساعدة والاختصارات')} size="md">
      <div className="space-y-5 text-sm">
        <ul className="divide-y divide-line-soft rounded-md border border-line">
          {rows.map(([k, d]) => (
            <li key={k} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <span className="text-muted">{d}</span>
              <kbd className="rounded border border-line bg-mist px-2 py-0.5 text-xs text-ink" dir="ltr">
                {k}
              </kbd>
            </li>
          ))}
        </ul>
        <p className="text-muted">
          {L(
            'This admin runs on mock data stored in your browser. Changes persist locally until you reset demo data in Settings → General.',
            'تعمل لوحة التحكم على بيانات تجريبية محفوظة في متصفحك. تبقى التغييرات محفوظة محليًا حتى تعيد تعيين البيانات من الإعدادات ← عام.',
          )}
        </p>
      </div>
    </Modal>
  )
}

export function Header({ title }: { title?: string }) {
  const { t } = useT()
  const navigate = useNavigate()
  const admin = useAuthStore((s) => s.admin)
  const toggleLang = useUIStore((s) => s.toggleLang)
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen)
  const setCommandOpen = useUIStore((s) => s.setCommandOpen)
  const [help, setHelp] = useState(false)

  const signOut = async () => {
    await logout()
    toast(t('auth.signedOut'))
    navigate('/login', { replace: true })
  }

  return (
    <header className="no-print sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-line bg-surface/90 px-3 backdrop-blur-md sm:px-5 lg:px-8">
      <IconButton label={t('common.openMenu')} onClick={() => setMobileNavOpen(true)} className="lg:hidden">
        <Menu className="size-5!" />
      </IconButton>
      <div className="lg:hidden">
        <AdminLogo collapsed />
      </div>
      {title && <p className="truncate text-sm font-semibold text-ink lg:hidden">{title}</p>}

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="hidden h-9 w-full max-w-md items-center gap-2.5 rounded-md border border-line bg-mist/60 px-3 text-[13px] text-subtle transition-colors hover:border-ink/25 hover:bg-surface md:flex"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 text-start">{t('common.commandHint')}</span>
        <kbd className="rounded border border-line bg-surface px-1.5 text-[10px] text-muted" dir="ltr">
          Ctrl K
        </kbd>
      </button>

      <div className="ms-auto flex items-center gap-0.5 sm:gap-1">
        <IconButton label={t('common.search')} onClick={() => setCommandOpen(true)} className="md:hidden">
          <Search className="size-[18px]!" />
        </IconButton>
        <button type="button" onClick={toggleLang} className="hidden h-9 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-mist sm:inline-flex" aria-label={t('common.language')}>
          <Globe className="size-4" aria-hidden />
          {t('common.switchLanguage')}
        </button>
        <NotificationBell />
        <IconButton label={t('common.help')} onClick={() => setHelp(true)} className="max-sm:hidden">
          <CircleHelp className="size-[18px]!" />
        </IconButton>
        <Dropdown
          widthClass="w-60"
          trigger={({ toggle, open }) => (
            <button type="button" onClick={toggle} aria-expanded={open} aria-label={admin?.name} className="ms-1 flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-mist">
              <Avatar name={admin?.name ?? 'Admin'} src={admin?.avatar} size="sm" />
              <span className="hidden text-start leading-tight xl:block">
                <span className="block text-[13px] font-medium text-ink">{admin?.name}</span>
                <span className="block text-[11px] text-muted">{admin && t(`roles.${admin.role}`)}</span>
              </span>
            </button>
          )}
          items={[
            { label: t('common.profile'), icon: <UserCircle />, onClick: () => navigate('/profile') },
            { label: t('common.settings'), icon: <Settings />, onClick: () => navigate('/settings') },
            { label: t('common.help'), icon: <CircleHelp />, onClick: () => setHelp(true) },
            { label: t('common.switchLanguage'), icon: <Globe />, onClick: toggleLang },
            { divider: true, label: '' },
            { label: t('common.logout'), icon: <LogOut />, onClick: signOut, danger: true },
          ]}
        >
          <div className="border-b border-line-soft px-3 py-2.5">
            <p className="truncate text-[13px] font-medium text-ink">{admin?.name}</p>
            <p className="truncate text-xs text-muted">{admin?.email}</p>
          </div>
        </Dropdown>
      </div>
      <HelpModal open={help} onClose={() => setHelp(false)} />
    </header>
  )
}
