import { useState } from 'react'
import { toast } from 'sonner'
import { DonutChart, seriesColor } from '@/components/charts/DonutChart'
import { formatSeriesLabel, formatSeriesLabelLong } from '@/components/charts/format'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { SimpleBarChart, SimpleLineChart } from '@/components/charts/SimpleBarChart'
import { CHART } from '@/components/charts/theme'
import { CategorySalesCard } from '@/components/dashboard/CategorySalesCard'
import { TableHeading } from '@/components/dashboard/TableHeading'
import { seriesCsvRows } from '@/components/reports/csv'
import { PrintHeader, ReportToolbar, useRangeLabel } from '@/components/reports/ReportToolbar'
import { useReportRange } from '@/components/reports/useReportRange'
import { Card, ChartCard, DataTable, ErrorState, Money, PageHeader, Skeleton, type Column } from '@/components/ui'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getRevenueByCity, getRevenueByPayment, getRevenueData } from '@/services/analyticsService'
import type { SeriesPoint } from '@/types'
import { cityName, downloadCsv, formatNumber, paymentName } from '@/utils'

const PAGE_SIZE = 15

export default function SalesReportPage() {
  const { t, lang } = useT()
  useDocumentTitle(t('reports.sales.title'))
  const range = useReportRange()
  const rangeLabel = useRangeLabel(range)
  const ds = range.dataset
  const [pg, setPg] = useState({ ds, page: 1 })
  const page = pg.ds === ds ? pg.page : 1
  const setPage = (n: number) => setPg({ ds, page: n })

  const series = useAsync(() => getRevenueData(ds), [ds])
  const cities = useAsync(() => getRevenueByCity(ds), [ds])
  const payments = useAsync(() => getRevenueByPayment(ds), [ds])

  const rows: (SeriesPoint & { aov: number })[] = (series.data ?? []).map((p) => ({ ...p, aov: p.aov ?? (p.orders ? Math.round(p.revenue / p.orders) : 0) }))
  const fmtX = (v: string) => formatSeriesLabel(v, lang)
  const fmtTip = (v: string) => formatSeriesLabelLong(v, lang)
  const cityData = (cities.data ?? []).map((c) => ({ ...c, name: cityName(c.city, lang) })).sort((a, b) => b.revenue - a.revenue)
  const paymentData = payments.data ?? []
  const paymentTotal = paymentData.reduce((s, p) => s + p.revenue, 0)

  const exportCsv = () => {
    if (!series.data?.length) return
    const out = seriesCsvRows(series.data, lang)
    downloadCsv(`sales-report-${ds}`, out)
    toast.success(t('common.exported', { count: out.length }))
  }

  const columns: Column<SeriesPoint & { aov: number }>[] = [
    { id: 'period', header: t('reports.sales.period'), mobile: 'title', hideable: false, cell: (p) => <span className="font-medium whitespace-nowrap">{fmtTip(p.label)}</span> },
    { id: 'orders', header: t('reports.sales.ordersCol'), align: 'end', mobile: 'meta', hideable: false, cell: (p) => <span className="tabular-nums">{formatNumber(p.orders)}</span> },
    { id: 'customers', header: t('reports.sales.customersCol'), align: 'end', mobile: 'meta', hideable: false, cell: (p) => <span className="tabular-nums">{p.customers !== undefined ? formatNumber(p.customers) : '—'}</span> },
    { id: 'aov', header: t('reports.sales.aovCol'), align: 'end', mobile: 'meta', hideable: false, cell: (p) => <Money value={p.aov} /> },
    { id: 'revenue', header: t('reports.sales.revenueCol'), align: 'end', mobile: 'end', hideable: false, cell: (p) => <Money value={p.revenue} className="font-medium" /> },
  ]
  const pageRows = [...rows].reverse().slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const chartLoading = series.loading && !series.data

  return (
    <div className="report-print">
      <PageHeader
        title={t('reports.sales.title')}
        description={t('reports.sales.description')}
        breadcrumbs={[{ label: t('nav.reports'), to: `/reports${range.search}` }, { label: t('reports.sales.title') }]}
      />
      <PrintHeader title={t('reports.sales.title')} rangeLabel={rangeLabel} />
      <ReportToolbar
        range={range}
        onExportCsv={exportCsv}
        onPrint={() => window.print()}
      />

      {series.error ? (
        <ErrorState onRetry={series.reload} className="card" />
      ) : (
        <div className="space-y-6">
          <ChartCard title={t('reports.sales.revenue')} description={rangeLabel} height={300} loading={chartLoading}>
            <RevenueChart data={rows} revenueLabel={t('dashboard.revenue.revenue')} />
          </ChartCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title={t('reports.sales.orders')} height={260} loading={chartLoading}>
              <SimpleBarChart data={rows} categoryKey="label" bars={[{ key: 'orders', name: t('reports.sales.ordersCol'), color: CHART.ink }]} formatCategory={fmtX} formatTooltipLabel={fmtTip} />
            </ChartCard>
            <ChartCard title={t('reports.sales.aov')} height={260} loading={chartLoading}>
              <SimpleLineChart data={rows} xKey="label" yKey="aov" name={t('reports.sales.aovCol')} money color={CHART.rose} formatX={fmtX} formatTooltipLabel={fmtTip} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title={t('reports.sales.byCity')} height={320} loading={cities.loading && !cities.data}>
              {cities.error ? (
                <ErrorState onRetry={cities.reload} className="py-8" />
              ) : (
                <SimpleBarChart data={cityData} categoryKey="name" horizontal money bars={[{ key: 'revenue', name: t('reports.sales.revenueCol'), color: CHART.rose }]} />
              )}
            </ChartCard>

            <Card title={t('reports.sales.byPayment')}>
              {payments.error ? (
                <ErrorState onRetry={payments.reload} className="py-8" />
              ) : payments.loading && !payments.data ? (
                <Skeleton className="h-72" />
              ) : (
                <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-2">
                  <div className="mx-auto h-48 w-full max-w-[200px]" dir="ltr">
                    <DonutChart
                      money
                      data={paymentData.map((p, i) => ({ key: p.method, name: paymentName(p.method, lang), value: p.revenue, color: seriesColor(i) }))}
                      center={<Money value={paymentTotal} compact className="text-base font-semibold text-ink" />}
                    />
                  </div>
                  <ul className="space-y-2">
                    {paymentData.map((p, i) => (
                      <li key={p.method} className="flex items-center gap-2.5 text-[13px]">
                        <span className="size-2.5 shrink-0 rounded-sm" style={{ background: seriesColor(i) }} aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-ink">{paymentName(p.method, lang)}</span>
                        <span className="w-10 text-end text-muted tabular-nums" dir="ltr">
                          {Math.round(p.share * 100)}%
                        </span>
                        <Money value={p.revenue} compact className="w-16 justify-end font-medium text-ink" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <CategorySalesCard range={ds} title={t('reports.sales.byCategory')} description={rangeLabel} />
            <DataTable
              className="lg:col-span-2"
              dense
              columns={columns}
              rows={series.data ? pageRows : undefined}
              rowKey={(p) => p.label}
              loading={series.loading}
              total={rows.length}
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              toolbar={<TableHeading title={t('reports.sales.summary')} description={t('reports.sales.summaryDesc')} />}
            />
          </div>
        </div>
      )}
    </div>
  )
}
