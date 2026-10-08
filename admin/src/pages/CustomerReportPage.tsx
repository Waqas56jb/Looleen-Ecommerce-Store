import { Briefcase, Crown, Repeat, UserPlus, Wallet, Gem } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { formatSeriesLabel, formatSeriesLabelLong } from '@/components/charts/format'
import { SimpleBarChart } from '@/components/charts/SimpleBarChart'
import { CHART } from '@/components/charts/theme'
import { TableHeading } from '@/components/dashboard/TableHeading'
import { PrintHeader, ReportToolbar, useRangeLabel } from '@/components/reports/ReportToolbar'
import { useReportRange } from '@/components/reports/useReportRange'
import { Avatar, ChartCard, DataTable, ErrorState, Money, PageHeader, StatCard, StatusBadge, type Column } from '@/components/ui'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getCustomerAnalytics } from '@/services/analyticsService'
import type { AdminCustomer } from '@/types'
import { cityName, downloadCsv, formatDate, formatNumber } from '@/utils'

export default function CustomerReportPage() {
  const { t, lang } = useT()
  useDocumentTitle(t('reports.customers.title'))
  const navigate = useNavigate()
  const range = useReportRange()
  const rangeLabel = useRangeLabel(range)
  const ds = range.dataset
  const { data, loading, error, reload } = useAsync(() => getCustomerAnalytics(ds), [ds])
  const busy = loading && !data

  const cityData = (data?.byCity ?? []).slice(0, 10).map((c) => ({ ...c, name: cityName(c.city, lang) }))

  const exportCsv = () => {
    if (!data) return
    const rows = data.topCustomers.map((c, i) => ({
      Rank: i + 1,
      Customer: c.name,
      Email: c.email,
      Phone: c.phone,
      City: cityName(c.city, 'en'),
      Type: c.customerType,
      Business: c.businessName ?? '',
      Orders: c.ordersCount,
      'Total Spent (SAR)': c.totalSpent,
      'Last Order': c.lastOrderAt?.slice(0, 10) ?? '',
      Registered: c.registeredAt.slice(0, 10),
    }))
    downloadCsv(`customer-report-${ds}`, rows)
    toast.success(t('common.exported', { count: rows.length }))
  }

  const columns: Column<AdminCustomer>[] = [
    {
      id: 'customer',
      header: t('common.customer'),
      mobile: 'title',
      hideable: false,
      cell: (c) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={c.name} size="sm" />
          <div className="min-w-0">
            <p className="max-w-52 truncate font-medium text-ink">{c.businessName ?? c.name}</p>
            <p className="max-w-52 truncate text-xs text-muted" dir="ltr">
              {c.email}
            </p>
          </div>
        </div>
      ),
    },
    { id: 'type', header: t('reports.customers.type'), mobile: 'end', hideable: false, cell: (c) => <StatusBadge status={c.customerType} /> },
    { id: 'city', header: t('common.city'), mobile: 'meta', hideable: false, cell: (c) => <span className="text-muted">{cityName(c.city, lang)}</span> },
    { id: 'orders', header: t('reports.customers.ordersCol'), align: 'end', mobile: 'meta', hideable: false, cell: (c) => <span className="tabular-nums">{formatNumber(c.ordersCount)}</span> },
    { id: 'last', header: t('reports.customers.lastOrder'), mobile: 'meta', hideable: false, cell: (c) => <span className="whitespace-nowrap text-muted">{formatDate(c.lastOrderAt, lang)}</span> },
    { id: 'spent', header: t('reports.customers.spent'), align: 'end', mobile: 'end', hideable: false, cell: (c) => <Money value={c.totalSpent} className="font-medium" /> },
  ]

  return (
    <div className="report-print">
      <PageHeader
        title={t('reports.customers.title')}
        description={t('reports.customers.description')}
        breadcrumbs={[{ label: t('nav.reports'), to: `/reports${range.search}` }, { label: t('reports.customers.title') }]}
      />
      <PrintHeader title={t('reports.customers.title')} rangeLabel={rangeLabel} />
      <ReportToolbar range={range} onExportCsv={exportCsv} onPrint={() => window.print()} />

      {error ? (
        <ErrorState onRetry={reload} className="card" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label={t('reports.customers.newCustomers')} icon={<UserPlus />} loading={busy} value={formatNumber(data?.newCustomers ?? 0)} period={rangeLabel} />
            <StatCard label={t('reports.customers.returning')} icon={<Repeat />} loading={busy} value={formatNumber(data?.returningCustomers ?? 0)} period={rangeLabel} />
            <StatCard label={t('reports.customers.vip')} icon={<Crown />} loading={busy} value={formatNumber(data?.vip ?? 0)} href="/customers?segment=vip" />
            <StatCard label={t('reports.customers.professional')} icon={<Briefcase />} loading={busy} value={formatNumber(data?.professional ?? 0)} href="/customers/professional" />
            <StatCard label={t('reports.customers.averageSpend')} icon={<Wallet />} loading={busy} value={<Money value={data?.averageSpend ?? 0} />} />
            <StatCard label={t('reports.customers.lifetimeValue')} icon={<Gem />} loading={busy} value={<Money value={data?.lifetimeValue ?? 0} />} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title={t('reports.customers.newVsReturning')}
              description={t('reports.customers.newVsReturningDesc')}
              height={300}
              loading={busy}
              actions={
                <ul className="flex items-center gap-3 text-xs text-muted">
                  <li className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm" style={{ background: CHART.rose }} aria-hidden />
                    {t('reports.customers.newCustomers')}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm" style={{ background: CHART.ink }} aria-hidden />
                    {t('reports.customers.returning')}
                  </li>
                </ul>
              }
            >
              <SimpleBarChart
                data={data?.series ?? []}
                categoryKey="label"
                bars={[
                  { key: 'newCustomers', name: t('reports.customers.newCustomers'), color: CHART.rose, stackId: 'c' },
                  { key: 'returning', name: t('reports.customers.returning'), color: CHART.ink, stackId: 'c' },
                ]}
                formatCategory={(v) => formatSeriesLabel(v, lang)}
                formatTooltipLabel={(v) => formatSeriesLabelLong(v, lang)}
              />
            </ChartCard>
            <ChartCard title={t('reports.customers.byCity')} description={t('reports.customers.byCityDesc')} height={300} loading={busy}>
              <SimpleBarChart data={cityData} categoryKey="name" horizontal bars={[{ key: 'count', name: t('reports.customers.count'), color: CHART.champagne }]} categoryWidth={84} />
            </ChartCard>
          </div>

          <DataTable
            dense
            columns={columns}
            rows={data?.topCustomers}
            rowKey={(c) => c.id}
            loading={loading}
            onRowClick={(c) => navigate(`/customers/${c.id}`)}
            toolbar={<TableHeading title={t('reports.customers.top')} description={t('reports.customers.topDesc')} to="/customers" />}
          />
        </div>
      )}
    </div>
  )
}
