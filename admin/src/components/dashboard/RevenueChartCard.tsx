import { RevenueChart } from '@/components/charts/RevenueChart'
import { CHART } from '@/components/charts/theme'
import { ChartCard, ErrorState, Money, Segmented } from '@/components/ui'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getRevenueData } from '@/services/analyticsService'
import type { DateRange } from '@/types'
import { formatNumber } from '@/utils'

export type ChartPeriod = '7d' | '30d' | '90d' | '12m'
export const CHART_PERIODS: ChartPeriod[] = ['7d', '30d', '90d', '12m']

/** Map the dashboard range onto the nearest chart period */
export function chartPeriodFor(range: DateRange): ChartPeriod {
  if (range === '30d') return '30d'
  if (range === '90d') return '90d'
  if (range === 'year' || range === '12m') return '12m'
  return '7d'
}

export function RevenueChartCard({ period, onPeriodChange, className }: { period: ChartPeriod; onPeriodChange: (p: ChartPeriod) => void; className?: string }) {
  const { t, dir } = useT()
  const { data, loading, error, reload } = useAsync(() => getRevenueData(period), [period])
  const totalRevenue = data?.reduce((s, p) => s + p.revenue, 0) ?? 0
  const totalOrders = data?.reduce((s, p) => s + p.orders, 0) ?? 0
  const options = CHART_PERIODS.map((p) => ({ value: p, label: t(`dashboard.revenue.periods.${p}`) }))

  return (
    <ChartCard
      className={className}
      title={t('dashboard.revenue.title')}
      description={t('dashboard.revenue.description')}
      height={300}
      loading={loading && !data}
      actions={<Segmented size="sm" className="max-sm:hidden" value={period} onChange={onPeriodChange} options={options} />}
    >
      {error ? (
        <ErrorState onRetry={reload} className="py-8" />
      ) : (
        <div className="flex size-full flex-col">
          <Segmented size="sm" className="mb-3 self-start sm:hidden" value={period} onChange={onPeriodChange} options={options} />
          <div dir={dir} className="mb-3 flex flex-wrap items-end gap-x-6 gap-y-2">
            <div>
              <p className="text-[11.5px] text-muted">{t('dashboard.revenue.total')}</p>
              <Money value={totalRevenue} className="text-lg font-semibold text-ink" />
            </div>
            <div>
              <p className="text-[11.5px] text-muted">{t('dashboard.revenue.totalOrders')}</p>
              <p className="text-lg font-semibold text-ink tabular-nums">{formatNumber(totalOrders)}</p>
            </div>
            <ul className="ms-auto flex items-center gap-4 text-xs text-muted">
              <li className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-sm" style={{ background: CHART.rose }} aria-hidden />
                {t('dashboard.revenue.revenue')}
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-0.5 w-3 rounded-full" style={{ background: CHART.ink }} aria-hidden />
                {t('dashboard.revenue.orders')}
              </li>
            </ul>
          </div>
          <div className="min-h-0 flex-1">
            <RevenueChart data={data ?? []} showOrders revenueLabel={t('dashboard.revenue.revenue')} ordersLabel={t('dashboard.revenue.orders')} />
          </div>
        </div>
      )}
    </ChartCard>
  )
}
