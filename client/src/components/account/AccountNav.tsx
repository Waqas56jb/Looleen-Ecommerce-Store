import { useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Bell,
  Gift,
  Heart,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPin,
  Package,
  RotateCcw,
  Sparkles,
  Star,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/common'
import { useT } from '@/i18n'
import { logout } from '@/services/authService'
import { useUnreadCount } from '@/store/account'
import type { User } from '@/types'
import { cn, formatDate } from '@/utils'
import { initials, loyaltyTier } from './shell'

interface NavItem {
  to: string
  key: string
  icon: LucideIcon
  end?: boolean
}

export const ACCOUNT_NAV: NavItem[] = [
  { to: '/account', key: 'dashboard', icon: LayoutDashboard, end: true },
  { to: '/account/orders', key: 'orders', icon: Package },
  { to: '/account/wishlist', key: 'wishlist', icon: Heart },
  { to: '/account/addresses', key: 'addresses', icon: MapPin },
  { to: '/account/loyalty', key: 'loyalty', icon: Gift },
  { to: '/account/reviews', key: 'reviews', icon: Star },
  { to: '/account/notifications', key: 'notifications', icon: Bell },
  { to: '/account/profile', key: 'profile', icon: UserRound },
  { to: '/account/returns', key: 'returns', icon: RotateCcw },
  { to: '/account/support', key: 'support', icon: LifeBuoy },
]

function useLogout() {
  const { t } = useT()
  const navigate = useNavigate()
  return async () => {
    await logout()
    toast(t('toast.signedOut'))
    navigate('/')
  }
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-blush font-serif font-medium text-rose ring-1 ring-champagne/50',
        size === 'md' ? 'size-14 text-xl' : 'size-11 text-base',
      )}
    >
      {initials(name)}
    </span>
  )
}

/** Desktop sidebar card (lg+) */
export function AccountSidebar({ user }: { user: User }) {
  const { t, lang } = useT()
  const unread = useUnreadCount()
  const onLogout = useLogout()
  const tier = loyaltyTier(user.loyaltyPoints).current.id
  return (
    <aside className="sticky top-28 rounded-xs border border-line bg-white">
      <div className="border-b border-line p-6">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} />
          <div className="min-w-0">
            <p className="truncate font-serif text-xl font-medium tracking-[-0.01em]">{user.name}</p>
            <p className="mt-0.5 text-xs text-muted">{t('account.layout.memberSince', { date: formatDate(user.memberSince, lang, { month: 'short', year: 'numeric' }) })}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <NavLink
            to="/account/loyalty"
            className="inline-flex h-7 items-center gap-1.5 rounded-full bg-champagne-soft px-3 text-xs font-semibold text-[#6e5226] transition-colors hover:bg-champagne/30"
          >
            <Sparkles className="size-3.5" aria-hidden />
            <span className="tabular-nums">{t('account.layout.points', { points: user.loyaltyPoints.toLocaleString('en-US') })}</span>
            <span className="opacity-60">·</span>
            {t(`account.loyalty.tiers.${tier}`)}
          </NavLink>
          {user.isProfessional && <Badge tone="champagne">{t('common.professional')}</Badge>}
        </div>
      </div>
      <nav aria-label={t('account.nav.label')} className="p-3">
        <ul className="space-y-0.5">
          {ACCOUNT_NAV.map(({ to, key, icon: Icon, end }) => (
            <li key={key}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'group flex h-11 items-center gap-3 rounded-xs px-3 text-sm transition-colors',
                    isActive ? 'bg-blush/70 font-semibold text-ink' : 'text-ink/80 hover:bg-mist hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('size-[18px] shrink-0', isActive ? 'text-rose' : 'text-muted group-hover:text-ink')} strokeWidth={1.6} aria-hidden />
                    <span className="flex-1">{t(`account.nav.${key}`)}</span>
                    {key === 'notifications' && unread > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1.5 text-[11px] font-semibold text-white tabular-nums" aria-label={t('account.nav.unread', { count: unread })}>
                        {unread}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
          <li className="mt-2 border-t border-line pt-2">
            <button type="button" onClick={onLogout} className="flex h-11 w-full items-center gap-3 rounded-xs px-3 text-sm text-ink/80 transition-colors hover:bg-mist hover:text-error">
              <LogOut className="size-[18px] shrink-0 rtl:-scale-x-100" strokeWidth={1.6} aria-hidden />
              {t('account.nav.logout')}
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

/** Mobile/tablet account header + horizontally scrolling pill nav (< lg) */
export function AccountMobileNav({ user }: { user: User }) {
  const { t } = useT()
  const unread = useUnreadCount()
  const onLogout = useLogout()
  const scroller = useRef<HTMLUListElement>(null)
  const { pathname } = useLocation()

  // Keep the active pill in view
  useEffect(() => {
    const active = scroller.current?.querySelector<HTMLElement>('[aria-current="page"]')
    active?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [pathname])

  return (
    <div className="mb-8 lg:hidden">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{t('account.layout.eyebrow')}</p>
          <p className="truncate font-serif text-2xl font-medium tracking-[-0.01em]">{t('account.layout.hello', { name: user.name.split(' ')[0] })}</p>
        </div>
        <NavLink to="/account/loyalty" className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-champagne-soft px-3 text-xs font-semibold text-[#6e5226]">
          <Sparkles className="size-3.5" aria-hidden />
          <span className="tabular-nums">{user.loyaltyPoints.toLocaleString('en-US')}</span>
        </NavLink>
      </div>
      <nav aria-label={t('account.nav.label')} className="mt-5">
        <ul ref={scroller} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
          {ACCOUNT_NAV.map(({ to, key, icon: Icon, end }) => (
            <li key={key} className="shrink-0">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex h-11 items-center gap-2 rounded-full border px-4 text-[13px] font-medium whitespace-nowrap transition-colors',
                    isActive ? 'border-ink bg-ink text-ivory' : 'border-line bg-white text-ink',
                  )
                }
              >
                <Icon className="size-4" strokeWidth={1.7} aria-hidden />
                {t(`account.nav.${key}`)}
                {key === 'notifications' && unread > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1.5 text-[11px] font-semibold text-white" aria-label={t('account.nav.unread', { count: unread })}>
                    {unread}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
          <li className="shrink-0">
            <button type="button" onClick={onLogout} className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-[13px] font-medium whitespace-nowrap text-ink">
              <LogOut className="size-4 rtl:-scale-x-100" strokeWidth={1.7} aria-hidden />
              {t('account.nav.logout')}
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )
}
