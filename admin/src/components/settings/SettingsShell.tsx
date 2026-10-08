import { useEffect, useRef, type ReactNode } from 'react'
import { NavLink, useBlocker } from 'react-router-dom'
import { Bell, CreditCard, Globe2, Percent, Store, Truck, UserCircle, Wrench, type LucideIcon } from 'lucide-react'
import { Button, ConfirmDialog, ErrorState, PageHeader, Skeleton } from '@/components/ui'
import { useT } from '@/i18n'
import { cn } from '@/utils'

export type SettingsSectionKey = 'general' | 'store' | 'payment' | 'shipping' | 'tax' | 'localization' | 'notifications' | 'profile'

export const SETTINGS_NAV: { key: SettingsSectionKey; to: string; icon: LucideIcon }[] = [
  { key: 'general', to: '/settings/general', icon: Wrench },
  { key: 'store', to: '/settings/store', icon: Store },
  { key: 'payment', to: '/settings/payment', icon: CreditCard },
  { key: 'shipping', to: '/settings/shipping', icon: Truck },
  { key: 'tax', to: '/settings/tax', icon: Percent },
  { key: 'localization', to: '/settings/localization', icon: Globe2 },
  { key: 'notifications', to: '/settings/notifications', icon: Bell },
  { key: 'profile', to: '/profile', icon: UserCircle },
]

/** Vertical nav on desktop, horizontal scrolling pills on mobile */
export function SettingsNav() {
  const { t } = useT()
  return (
    <nav aria-label={t('common.settings')} className="min-w-0">
      {/* Mobile pills */}
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:hidden">
        <li className="shrink-0">
          <NavLink
            to="/settings"
            end
            className={({ isActive }) => cn('inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors', isActive ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:bg-mist')}
          >
            {t('settings.nav.overview')}
          </NavLink>
        </li>
        {SETTINGS_NAV.map((n) => (
          <li key={n.key} className="shrink-0">
            <NavLink
              to={n.to}
              className={({ isActive }) => cn('inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors', isActive ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:bg-mist')}
            >
              <n.icon className="size-3.5" aria-hidden />
              {t(`settings.nav.${n.key}`)}
            </NavLink>
          </li>
        ))}
      </ul>
      {/* Desktop vertical nav */}
      <ul className="sticky top-20 hidden space-y-0.5 lg:block">
        <li>
          <NavLink
            to="/settings"
            end
            className={({ isActive }) => cn('flex h-9 items-center gap-2.5 rounded-md border-s-2 px-3 text-[13px] font-medium transition-colors', isActive ? 'border-rose bg-surface text-ink shadow-card' : 'border-transparent text-muted hover:bg-mist hover:text-ink')}
          >
            <span className="eyebrow">{t('settings.nav.overview')}</span>
          </NavLink>
        </li>
        {SETTINGS_NAV.map((n) => (
          <li key={n.key}>
            <NavLink
              to={n.to}
              className={({ isActive }) => cn('flex h-9 items-center gap-2.5 rounded-md border-s-2 px-3 text-[13px] font-medium transition-colors', isActive ? 'border-rose bg-surface text-ink shadow-card' : 'border-transparent text-muted hover:bg-mist hover:text-ink')}
            >
              <n.icon className="size-4 shrink-0" aria-hidden />
              {t(`settings.nav.${n.key}`)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

interface ShellProps {
  section?: SettingsSectionKey
  title: string
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

/** Shared layout for all settings pages: header + inline-start nav + content */
export function SettingsShell({ section, title, description, actions, children }: ShellProps) {
  const { t } = useT()
  return (
    <>
      <PageHeader title={title} description={description} actions={actions} breadcrumbs={section ? [{ label: t('common.settings'), to: '/settings' }, { label: title }] : [{ label: t('common.settings') }]} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        <SettingsNav />
        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </>
  )
}

/** Loading placeholder for a settings form */
export function SettingsSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="card space-y-4 p-5">
          <Skeleton className="h-5 w-48" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SettingsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="card">
      <ErrorState onRetry={onRetry} />
    </div>
  )
}

/**
 * Sticky Discard / Save bar shown while the form is dirty. Also blocks
 * in-app navigation and tab close while there are unsaved changes.
 */
export function SaveBar({ dirty, saving, onSave, onDiscard }: { dirty: boolean; saving: boolean; onSave: () => Promise<boolean> | void; onDiscard: () => void }) {
  const { t } = useT()
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !saving && currentLocation.pathname !== nextLocation.pathname)
  const proceeding = useRef(false)

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  return (
    <>
      {dirty && (
        <div className="sticky bottom-3 z-20 animate-fade-up">
          <div className="flex flex-col gap-3 rounded-lg border border-ink/10 bg-ink px-4 py-3 text-white shadow-pop sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-[13px] font-medium">
              <span className="size-2 shrink-0 rounded-full bg-champagne" aria-hidden />
              {t('common.unsavedChanges')}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving} className="flex-1 text-white hover:bg-white/10 sm:flex-none">
                {t('settings.discard')}
              </Button>
              <Button variant="accent" size="sm" onClick={() => void onSave()} loading={saving} className="flex-1 sm:flex-none">
                {saving ? t('common.saving') : t('common.saveChanges')}
              </Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onClose={() => {
          if (!proceeding.current) blocker.reset?.()
          proceeding.current = false
        }}
        onConfirm={() => {
          proceeding.current = true
          blocker.proceed?.()
        }}
        title={t('settings.leaveTitle')}
        description={t('settings.leaveDesc')}
        confirmLabel={t('settings.leaveConfirm')}
        cancelLabel={t('settings.leaveCancel')}
      />
    </>
  )
}

/** Class for a labelled <Switch> row inside a divide-y list */
export const ROW = 'py-4 first:pt-0 last:pb-0'

/** A label/description + control row used inside settings cards */
export function SettingRow({ title, description, children, className }: { title: ReactNode; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
