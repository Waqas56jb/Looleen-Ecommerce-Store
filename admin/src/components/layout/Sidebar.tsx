import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronsLeft, ExternalLink } from 'lucide-react'
import { STORE_CONFIG } from '@/config/store'
import { useT } from '@/i18n'
import { useAuthStore } from '@/store/authStore'
import { db } from '@/store/db'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/utils'
import { can } from '@/utils/permissions'
import { Tooltip } from '@/components/ui'
import { NAV, type NavChild, type NavGroup } from './navigation'

export function AdminLogo({ collapsed, light }: { collapsed?: boolean; light?: boolean }) {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5" aria-label={STORE_CONFIG.adminTitle} dir="ltr">
      <span className={cn('grid size-8 shrink-0 place-items-center rounded-md font-serif text-[15px] font-semibold tracking-wider', light ? 'bg-white text-ink' : 'bg-ink text-champagne')}>
        <svg viewBox="0 0 40 24" className="h-4 w-7" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
          <circle cx="13" cy="12" r="9" />
          <circle cx="27" cy="12" r="9" className="text-rose" stroke="#B76E79" />
        </svg>
      </span>
      {!collapsed && (
        <span className="flex flex-col leading-none">
          <span className={cn('font-serif text-[19px] font-semibold tracking-[0.08em]', light ? 'text-white' : 'text-ink')}>{STORE_CONFIG.name}</span>
          <span className="mt-0.5 text-[9.5px] font-semibold tracking-[0.24em] text-subtle uppercase">Admin</span>
        </span>
      )}
    </Link>
  )
}

function useBadges() {
  const pendingOrders = db.orders((s) => s.items.filter((o) => o.status === 'pending').length)
  const pendingReviews = db.reviews((s) => s.items.filter((r) => r.status === 'pending').length)
  const openReturns = db.returns((s) => s.items.filter((r) => r.status === 'requested').length)
  return { pendingOrders, pendingReviews, openReturns }
}

/** A child is active when its path matches and its query filter (if any) matches; the most specific sibling wins */
function isChildActive(child: NavChild, group: NavGroup, pathname: string, search: string) {
  const path = child.to.split('?')[0]
  const pathMatch = pathname === path || pathname.startsWith(path + '/')
  if (!pathMatch) return false
  if (child.match) return search.includes(child.match)
  const siblings = group.children ?? []
  // A sibling with a query match (e.g. ?status=pending) takes precedence
  if (siblings.some((c) => c.match && c.to.split('?')[0] === path && search.includes(c.match))) return false
  // A longer sibling path (e.g. /customers/professional) takes precedence over /customers
  return !siblings.some((c) => c !== child && !c.match && c.to.length > child.to.length && (pathname === c.to || pathname.startsWith(c.to + '/')))
}

export function SidebarNav({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { t } = useT()
  const { pathname, search } = useLocation()
  const role = useAuthStore((s) => s.admin?.role)
  const badges = useBadges()
  const groups = NAV.filter((g) => !g.permission || can(role, g.permission))
  const activeGroup = (g: NavGroup) => (g.to ? pathname === g.to || pathname.startsWith(g.to + '/') : !!g.children?.some((c) => isChildActive(c, g, pathname, search)))
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(groups.map((g) => [g.id, activeGroup(g)])))
  useEffect(() => {
    groups.forEach((g) => activeGroup(g) && setOpen((o) => (o[g.id] ? o : { ...o, [g.id]: true })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const itemBase = 'relative flex w-full items-center gap-3 rounded-md text-[13.5px] transition-colors duration-150'

  return (
    <nav aria-label="Admin" className="space-y-0.5">
      {groups.map((g) => {
        const Icon = g.icon
        const active = activeGroup(g)
        const count = g.badge ? badges[g.badge] : 0
        const indicator = active && <span aria-hidden className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-rose" />
        if (g.to || collapsed) {
          const to = g.to ?? g.children![0].to
          const link = (
            <Link
              to={to}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(itemBase, collapsed ? 'size-10 justify-center' : 'h-9 px-3', active ? 'bg-rose-soft font-medium text-ink' : 'text-muted hover:bg-mist hover:text-ink')}
            >
              {indicator}
              <Icon className={cn('size-[18px] shrink-0', active && 'text-rose')} strokeWidth={1.8} aria-hidden />
              {!collapsed && <span className="flex-1 truncate">{t(g.labelKey)}</span>}
              {count > 0 && (collapsed ? <span className="absolute end-1 top-1 size-2 rounded-full bg-rose" aria-label={String(count)} /> : <span className="rounded bg-rose px-1.5 text-[10.5px] font-semibold text-white tabular-nums">{count}</span>)}
            </Link>
          )
          return collapsed ? (
            <div key={g.id} className="flex justify-center">
              <Tooltip content={t(g.labelKey)}>{link}</Tooltip>
            </div>
          ) : (
            <div key={g.id}>{link}</div>
          )
        }
        const isOpen = open[g.id]
        return (
          <div key={g.id}>
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [g.id]: !o[g.id] }))}
              aria-expanded={isOpen}
              className={cn(itemBase, 'h-9 px-3', active ? 'font-medium text-ink' : 'text-muted hover:bg-mist hover:text-ink')}
            >
              <Icon className={cn('size-[18px] shrink-0', active && 'text-rose')} strokeWidth={1.8} aria-hidden />
              <span className="flex-1 truncate text-start">{t(g.labelKey)}</span>
              {count > 0 && <span className="rounded bg-rose px-1.5 text-[10.5px] font-semibold text-white tabular-nums">{count}</span>}
              <ChevronDown className={cn('size-3.5 shrink-0 text-subtle transition-transform duration-200', isOpen && 'rotate-180')} aria-hidden />
            </button>
            <div className={cn('grid transition-[grid-template-rows] duration-200 ease-out', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
              <ul className="overflow-hidden">
                {g.children!.map((c) => {
                  const act = isChildActive(c, g, pathname, search)
                  return (
                    <li key={c.to}>
                      <Link
                        to={c.to}
                        onClick={onNavigate}
                        tabIndex={isOpen ? 0 : -1}
                        aria-current={act ? 'page' : undefined}
                        className={cn('relative ms-[21px] flex h-8 items-center border-s ps-4 pe-2 text-[13px] transition-colors', act ? 'border-rose font-medium text-ink' : 'border-line text-muted hover:border-ink/30 hover:text-ink')}
                      >
                        {t(c.labelKey)}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )
      })}
    </nav>
  )
}

export function Sidebar() {
  const { t } = useT()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggle = useUIStore((s) => s.toggleSidebar)
  return (
    <aside className={cn('sticky top-0 hidden h-dvh shrink-0 flex-col border-e border-line bg-surface transition-[width] duration-200 ease-out lg:flex', collapsed ? 'w-[76px]' : 'w-[264px]')}>
      <div className={cn('flex h-16 shrink-0 items-center border-b border-line-soft', collapsed ? 'justify-center px-2' : 'px-5')}>
        <AdminLogo collapsed={collapsed} />
      </div>
      <div className={cn('thin-scrollbar min-h-0 flex-1 overflow-y-auto py-4', collapsed ? 'px-2' : 'px-3')}>
        <SidebarNav collapsed={collapsed} />
      </div>
      <div className={cn('shrink-0 space-y-1 border-t border-line-soft p-3', collapsed && 'flex flex-col items-center')}>
        <a href={STORE_CONFIG.storefrontUrl} target="_blank" rel="noreferrer" className={cn('flex h-9 items-center gap-3 rounded-md text-[13px] text-muted transition-colors hover:bg-mist hover:text-ink', collapsed ? 'w-10 justify-center' : 'px-3')} title={t('nav.viewStore')}>
          <ExternalLink className="size-4 shrink-0" aria-hidden />
          {!collapsed && t('nav.viewStore')}
        </a>
        <button type="button" onClick={toggle} className={cn('flex h-9 items-center gap-3 rounded-md text-[13px] text-muted transition-colors hover:bg-mist hover:text-ink', collapsed ? 'w-10 justify-center' : 'w-full px-3')} aria-label={collapsed ? t('common.expandSidebar') : t('common.collapseSidebar')}>
          <ChevronsLeft className={cn('size-4 shrink-0 transition-transform rtl:-scale-x-100', collapsed && 'rotate-180 rtl:rotate-0 rtl:scale-x-100')} aria-hidden />
          {!collapsed && t('common.collapseSidebar')}
        </button>
      </div>
    </aside>
  )
}
