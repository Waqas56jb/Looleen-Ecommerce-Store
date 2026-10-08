import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CategorySalesCard } from '@/components/dashboard/CategorySalesCard'
import { DASHBOARD_RANGES, DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { KpiGrid } from '@/components/dashboard/KpiGrid'
import { LowStockCard } from '@/components/dashboard/LowStockCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard'
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable'
import { chartPeriodFor, RevenueChartCard, type ChartPeriod } from '@/components/dashboard/RevenueChartCard'
import { TopProductsTable } from '@/components/dashboard/TopProductsTable'
import { ErrorState } from '@/components/ui'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getDashboardStats } from '@/services/analyticsService'
import type { DateRange } from '@/types'

export default function DashboardPage() {
  const { t } = useT()
  useDocumentTitle(t('dashboard.title'))
  const [params, setParams] = useSearchParams()
  const fromUrl = params.get('range') as DateRange | null
  const range: DateRange = fromUrl && DASHBOARD_RANGES.includes(fromUrl) ? fromUrl : '30d'
  const [period, setPeriod] = useState<ChartPeriod>(() => chartPeriodFor(range))

  const stats = useAsync(() => getDashboardStats(range), [range])

  const changeRange = (r: DateRange) => {
    const next = new URLSearchParams(params)
    if (r === '30d') next.delete('range')
    else next.set('range', r)
    setParams(next, { replace: true })
    setPeriod(chartPeriodFor(r))
  }

  return (
    <div>
      <DashboardHeader range={range} onRangeChange={changeRange} />
      <div className="space-y-6">
        <QuickActions />

        {stats.error ? <ErrorState onRetry={stats.reload} className="card" /> : <KpiGrid stats={stats.data} loading={stats.loading} />}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <RevenueChartCard className="lg:col-span-2" period={period} onPeriodChange={setPeriod} />
          <CategorySalesCard range={range} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <TopProductsTable range={range} className="xl:col-span-3" />
          <LowStockCard className="xl:col-span-2" onChanged={stats.reload} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <RecentOrdersTable className="xl:col-span-2" />
          <RecentActivityCard />
        </div>
      </div>
    </div>
  )
}
