import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, LayoutDashboard, Package, Settings, ShoppingBag, Users, Warehouse } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui'
import { useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'

const LINKS = [
  { to: '/orders', key: 'orders', icon: ShoppingBag },
  { to: '/products', key: 'products', icon: Package },
  { to: '/customers', key: 'customers', icon: Users },
  { to: '/inventory', key: 'inventory', icon: Warehouse },
  { to: '/settings', key: 'settings', icon: Settings },
] as const

export default function NotFoundPage() {
  const { t } = useT()
  useDocumentTitle(t('system.notFound.docTitle'))
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center py-10 text-center sm:py-16">
      <p className="eyebrow">{t('system.notFound.eyebrow')}</p>
      <h1 className="mt-3 font-serif text-[96px] leading-none font-medium tracking-tight text-ink sm:text-[140px]" aria-label="404">
        4<span className="text-rose">0</span>4
      </h1>
      <p className="mt-4 text-xl font-semibold text-ink">{t('system.notFound.title')}</p>
      <p className="mt-2 max-w-md text-sm text-muted">{t('system.notFound.desc')}</p>
      <code dir="ltr" className="mt-3 max-w-full truncate rounded bg-mist px-2 py-1 font-mono text-xs text-muted">
        {pathname}
      </code>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <ButtonLink to="/dashboard" icon={<LayoutDashboard className="size-4" />}>
          {t('nav.dashboard')}
        </ButtonLink>
        <Button variant="outline" icon={<ArrowLeft className="size-4 rtl:-scale-x-100" />} onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/dashboard'))}>
          {t('system.notFound.back')}
        </Button>
      </div>
      <div className="card mt-12 w-full text-start">
        <p className="eyebrow border-b border-line-soft px-5 py-3">{t('system.notFound.quickLinks')}</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2">
          {LINKS.map((l) => (
            <li key={l.to} className="border-b border-line-soft last:border-0 sm:[&:nth-last-child(-n+2)]:border-0 sm:odd:border-e">
              <Link to={l.to} className="group flex items-center gap-3 px-5 py-3.5 text-sm text-ink hover:bg-mist">
                <l.icon className="size-4 text-muted" aria-hidden />
                <span className="flex-1">{t(`nav.${l.key}`)}</span>
                <ChevronRight className="size-4 text-subtle rtl:-scale-x-100" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
