import { Suspense } from 'react'
import { Navigate, Outlet, useSearchParams } from 'react-router-dom'
import { Globe } from 'lucide-react'
import { AdminLogo } from '@/components/layout/Sidebar'
import { Img, PageSkeleton } from '@/components/ui'
import { IMAGE_POOL } from '@/data/catalog/images'
import { useT } from '@/i18n'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { AppToaster } from './AdminLayout'

/** Split-screen auth shell; signed-in admins are sent to the dashboard */
export function AuthLayout() {
  const token = useAuthStore((s) => s.token)
  const [params] = useSearchParams()
  const { t, lang } = useT()
  const toggleLang = useUIStore((s) => s.toggleLang)
  if (token) {
    const r = params.get('redirect')
    return <Navigate to={r && r.startsWith('/') && !r.startsWith('//') ? r : '/dashboard'} replace />
  }
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,1.05fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <AdminLogo />
          <button type="button" onClick={toggleLang} className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-ink hover:bg-mist">
            <Globe className="size-4" aria-hidden /> {t('common.switchLanguage')}
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <Suspense fallback={<PageSkeleton stats={0} rows={3} />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
        <p className="text-xs text-subtle">© {new Date().getFullYear()} LOOKS · {lang === 'ar' ? 'لوحة الإدارة' : 'Administration'}</p>
      </div>
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <Img src={IMAGE_POOL.flatlay[0]} alt="" w={1400} className="absolute inset-0 size-full opacity-70" />
        <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/40 to-ink/10" />
        <div className="absolute inset-x-12 bottom-12 text-white">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-champagne uppercase">{lang === 'ar' ? 'أصلي 100% · موزعون معتمدون' : '100% Original · Authorized distributors'}</p>
          <p className="mt-3 max-w-md font-serif text-4xl leading-tight">{lang === 'ar' ? 'أديري متجر الجمال الأصلي في المملكة بثقة.' : 'Run Saudi Arabia’s home of original beauty — with confidence.'}</p>
        </div>
      </div>
      <AppToaster />
    </div>
  )
}
