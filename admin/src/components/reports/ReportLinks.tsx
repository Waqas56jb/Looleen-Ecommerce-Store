import type { ReactNode } from 'react'
import { ArrowRight, ChartColumn, Package, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useT } from '@/i18n'

const LINKS: { key: 'sales' | 'products' | 'customers'; to: string; icon: ReactNode }[] = [
  { key: 'sales', to: '/reports/sales', icon: <ChartColumn /> },
  { key: 'products', to: '/reports/products', icon: <Package /> },
  { key: 'customers', to: '/reports/customers', icon: <Users /> },
]

export function ReportLinks({ search = '' }: { search?: string }) {
  const { t } = useT()
  return (
    <section className="no-print" aria-labelledby="detailed-reports">
      <h2 id="detailed-reports" className="eyebrow mb-3">
        {t('reports.detailed')}
      </h2>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {LINKS.map((l) => (
          <li key={l.key}>
            <Link to={`${l.to}${search}`} className="group card flex h-full flex-col gap-3 p-5 transition-colors hover:border-ink/20">
              <span className="grid size-9 place-items-center rounded-md bg-mist text-ink transition-colors group-hover:bg-rose-soft group-hover:text-rose-dark [&>svg]:size-4">{l.icon}</span>
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-ink">{t(`reports.cards.${l.key}.title`)}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{t(`reports.cards.${l.key}.desc`)}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[13px] font-medium text-ink">
                {t('reports.open')}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
