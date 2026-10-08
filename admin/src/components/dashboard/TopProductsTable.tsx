import { useNavigate } from 'react-router-dom'
import { DataTable, EmptyState, Money, Thumb, type Column } from '@/components/ui'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getTopProducts, type TopProduct } from '@/services/analyticsService'
import type { DateRange } from '@/types'
import { cn, formatNumber } from '@/utils'
import { TableHeading, TrendValue } from './TableHeading'

const LOW_STOCK = 10

export function TopProductsTable({ range, className }: { range: DateRange; className?: string }) {
  const { t } = useT()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => getTopProducts(10, range, 'best'), [range])

  const columns: Column<TopProduct>[] = [
    {
      id: 'product',
      header: t('common.product'),
      mobile: 'title',
      hideable: false,
      cell: (p) => (
        <div className="flex min-w-0 items-center gap-3">
          <Thumb src={p.image} alt={p.name} size="sm" />
          <div className="min-w-0">
            <p className="max-w-56 truncate font-medium text-ink">{p.name}</p>
            <p className="truncate text-xs text-muted">{p.brandName}</p>
          </div>
        </div>
      ),
    },
    { id: 'category', header: t('common.category'), hideable: false, mobile: 'meta', cell: (p) => <span className="text-muted">{p.category}</span> },
    { id: 'units', header: t('dashboard.topProducts.unitsSold'), align: 'end', hideable: false, mobile: 'meta', cell: (p) => <span className="tabular-nums">{formatNumber(p.unitsSold)}</span> },
    { id: 'revenue', header: t('dashboard.topProducts.revenue'), align: 'end', hideable: false, mobile: 'end', cell: (p) => <Money value={p.revenue} className="font-medium" /> },
    {
      id: 'stock',
      header: t('dashboard.topProducts.stock'),
      align: 'end',
      hideable: false,
      mobile: 'meta',
      cell: (p) => <span className={cn('tabular-nums', p.stock === 0 ? 'font-medium text-error' : p.stock <= LOW_STOCK ? 'font-medium text-warning' : 'text-ink')}>{formatNumber(p.stock)}</span>,
    },
    { id: 'trend', header: t('dashboard.topProducts.trend'), align: 'end', hideable: false, mobile: 'end', cell: (p) => <TrendValue value={p.trend} /> },
  ]

  return (
    <DataTable
      className={className}
      dense
      columns={columns}
      rows={data}
      rowKey={(p) => p.id}
      loading={loading}
      error={error}
      onRetry={reload}
      onRowClick={(p) => navigate(`/products/${p.id}`)}
      toolbar={<TableHeading title={t('dashboard.topProducts.title')} description={t('dashboard.topProducts.description')} to="/reports/products" />}
      empty={<EmptyState title={t('dashboard.topProducts.empty')} />}
    />
  )
}
