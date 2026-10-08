import { Suspense } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingSpinner } from '@/components/common'
import { AccountMobileNav, AccountSidebar } from '@/components/account/AccountNav'
import { AccountShellContext } from '@/components/account/shell'
import { useT } from '@/i18n'
import { useAuthStore } from '@/store/auth'

/**
 * Customer account shell. Every /account/* route requires a session —
 * except the wishlist, which guests can view from their local storage.
 */
export function AccountLayout() {
  const user = useAuthStore((s) => s.user)
  const { pathname, search } = useLocation()
  const { t } = useT()
  const fallback = <LoadingSpinner className="min-h-[40vh]" label={t('common.loading')} />

  if (!user) {
    const isWishlist = /^\/account\/wishlist\/?$/.test(pathname)
    if (isWishlist) {
      // Guests: the wishlist renders its own standalone shell
      return (
        <AccountShellContext.Provider value={false}>
          <Suspense fallback={fallback}>
            <Outlet />
          </Suspense>
        </AccountShellContext.Provider>
      )
    }
    return <Navigate to={`/login?redirect=${encodeURIComponent(pathname + search)}`} replace />
  }

  return (
    <AccountShellContext.Provider value={true}>
      <div className="bg-ivory">
        <div className="container-x py-10 lg:py-16">
          <AccountMobileNav user={user} />
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-14">
            <div className="hidden lg:block">
              <AccountSidebar user={user} />
            </div>
            <div className="min-w-0">
              <Suspense fallback={fallback}>
                <Outlet />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </AccountShellContext.Provider>
  )
}
