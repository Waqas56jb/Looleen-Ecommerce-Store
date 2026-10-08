import { ClipboardList, FolderTree, Image, PackagePlus, Tag, Ticket } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '@/i18n'

const ACTIONS: { key: string; to: string; icon: ReactNode }[] = [
  { key: 'addProduct', to: '/products/new', icon: <PackagePlus /> },
  { key: 'addBrand', to: '/brands/new', icon: <Tag /> },
  { key: 'addCategory', to: '/categories/new', icon: <FolderTree /> },
  { key: 'createCoupon', to: '/coupons/new', icon: <Ticket /> },
  { key: 'createBanner', to: '/banners/new', icon: <Image /> },
  { key: 'viewOrders', to: '/orders', icon: <ClipboardList /> },
]

export function QuickActions() {
  const { t } = useT()
  return (
    <nav aria-label={t('dashboard.quickActions')}>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {ACTIONS.map((a) => (
          <li key={a.key}>
            <Link
              to={a.to}
              className="group flex h-full min-h-11 items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink shadow-card transition-colors hover:border-ink/20 hover:bg-mist/60 focus-visible:outline-2 focus-visible:outline-rose"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-mist text-ink transition-colors group-hover:bg-rose-soft group-hover:text-rose-dark [&>svg]:size-4">{a.icon}</span>
              <span className="min-w-0 truncate">{t(`dashboard.actions.${a.key}`)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
