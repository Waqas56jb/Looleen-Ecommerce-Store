import { MousePointerClick, Package, Receipt, RotateCcw, ShoppingBag, ShoppingCart, Users, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { ConversionFunnel } from '@/components/reports/ConversionFunnel'
import { ReportLinks } from '@/components/reports/ReportLinks'
import { PrintHeader, ReportToolbar, useRangeLabel } from '@/components/reports/ReportToolbar'
import { useReportRange } from '@/components/reports/useReportRange'
import { seriesCsvRows } from '@/components/reports/csv'
import { ChartCard, ErrorState, Money, PageHeader, StatCard } from '@/components/ui'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getConversion, getDashboardStats, getRevenueData } from '@/services/analyticsService'
import { downloadCsv, formatNumber } from '@/utils'

export default function ReportsPage() {
  const { t, lang } = useT()
  useDocumentTitle(t('reports.title'))
  const range = useReportRange()
  const rangeLabel = useRangeLabel(range)
  const ds = range.dataset

  const stats = useAsync(() => getDashboardStats(ds), [ds])
  const conv = useAsync(() => getConversion(ds), [ds])
  const series = useAsync(() => getRevenueData(ds), [ds])

  const s = stats.data
  const c = conv.data
  const vs = t('common.vsPrevious')
  const busy = stats.loading && !s

  const exportCsv = () => {
    if (!series.data?.length) return
    const rows = seriesCsvRows(series.data, lang)
    downloadCsv(`revenue-${ds}`, rows)
    toast.success(t('common.exported', { count: rows.length }))
  }

  return (
    <div className="report-print">
      <PageHeader title={t('reports.title')} description={t('reports.overviewDesc')} breadcrumbs={[{ label: t('nav.reports') }]} />
      <PrintHeader title={t('reports.title')} rangeLabel={rangeLabel} />
      <ReportToolbar range={range} onExportCsv={exportCsv} onPrint={() => window.print()} />

      <div className="space-y-6">
        {stats.error ? (
          <ErrorState onRetry={stats.reload} className="card" />
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label={t('reports.kpi.revenue')} icon={<Wallet />} loading={busy} value={<Money value={s?.revenue.value ?? 0} />} change={s?.revenue.change} period={vs} />
            <StatCard label={t('reports.kpi.orders')} icon={<ShoppingBag />} loading={busy} value={formatNumber(s?.orders.value ?? 0)} change={s?.orders.change} period={vs} />
            <StatCard label={t('reports.kpi.customers')} icon={<Users />} loading={busy} value={formatNumber(s?.customers.value ?? 0)} change={s?.customers.change} period={vs} />
            <StatCard label={t('reports.kpi.productsSold')} icon={<Package />} loading={busy} value={formatNumber(s?.productsSold.value ?? 0)} change={s?.productsSold.change} period={vs} />
            <StatCard label={t('reports.kpi.returns')} icon={<RotateCcw />} loading={busy} value={formatNumber(s?.returns ?? 0)} href="/returns" period={t('dashboard.kpi.returnsHint')} />
            <StatCard label={t('reports.kpi.aov')} icon={<Receipt />} loading={busy} value={<Money value={s?.averageOrderValue.value ?? 0} />} change={s?.averageOrderValue.change} period={vs} />
            <StatCard
              label={t('reports.kpi.conversion')}
              icon={<MousePointerClick />}
              loading={!c}
              value={<span dir="ltr">{(c?.rate ?? 0).toFixed(2)}%</span>}
              period={c ? t('reports.kpi.ofSessions', { count: formatNumber(c.sessions) }) : undefined}
            />
            <StatCard
              label={t('reports.kpi.cartRate')}
              icon={<ShoppingCart />}
              loading={!c}
              value={<span dir="ltr">{(c?.cartRate ?? 0).toFixed(1)}%</span>}
              period={c ? t('reports.kpi.ofSessions', { count: formatNumber(c.sessions) }) : undefined}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ChartCard className="lg:col-span-2" title={t('reports.revenueTrend')} description={`${t('reports.revenueTrendDesc')} · ${rangeLabel}`} height={300} loading={series.loading && !series.data}>
            {series.error ? <ErrorState onRetry={series.reload} className="py-8" /> : <RevenueChart data={series.data ?? []} revenueLabel={t('dashboard.revenue.revenue')} />}
          </ChartCard>
          {conv.error ? <ErrorState onRetry={conv.reload} className="card" /> : <ConversionFunnel data={c} loading={conv.loading} />}
        </div>

        <ReportLinks search={range.search} />
      </div>
    </div>
  )
}
