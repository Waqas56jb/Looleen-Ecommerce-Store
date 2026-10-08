import { Suspense, useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { Header } from '@/components/layout/Header'
import { AdminLogo, Sidebar, SidebarNav } from '@/components/layout/Sidebar'
import { Drawer, PageSkeleton } from '@/components/ui'
import { useT } from '@/i18n'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

function MobileNav() {
  const open = useUIStore((s) => s.mobileNavOpen)
  const setOpen = useUIStore((s) => s.setMobileNavOpen)
  const { pathname, search } = useLocation()
  useEffect(() => setOpen(false), [pathname, search, setOpen])
  return (
    <Drawer open={open} onClose={() => setOpen(false)} side="start" widthClass="max-w-[290px]" title={<AdminLogo />}>
      <div className="p-3">
        <SidebarNav onNavigate={() => setOpen(false)} />
      </div>
    </Drawer>
  )
}

/** Toasts, mirrored for RTL */
export function AppToaster() {
  const { dir } = useT()
  return (
    <Toaster
      position={dir === 'rtl' ? 'bottom-left' : 'bottom-right'}
      dir={dir}
      closeButton
      toastOptions={{ classNames: { toast: '!rounded-lg !border-line !bg-surface !text-ink !shadow-pop !font-sans', description: '!text-muted', actionButton: '!bg-ink !text-white' } }}
    />
  )
}

/** Authenticated shell: sidebar + header + routed content */
export function AdminLayout() {
  const token = useAuthStore((s) => s.token)
  const location = useLocation()
  const { pathname } = location
  useEffect(() => {
    document.querySelector('main')?.scrollTo?.({ top: 0 })
    window.scrollTo({ top: 0 })
  }, [pathname])
  if (!token) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return (
    <div className="flex min-h-dvh bg-ivory">
      <a href="#admin-main" className="sr-only z-[100] rounded-md bg-ink px-3 py-2 text-white focus:not-sr-only focus:fixed focus:start-3 focus:top-3">
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main id="admin-main" className="min-w-0 flex-1">
          <div className="page-container animate-fade-in" key={pathname}>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
      <MobileNav />
      <CommandPalette />
      <AppToaster />
    </div>
  )
}
