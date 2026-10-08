import { useNavigate } from 'react-router-dom'
import { DataTable, EmptyState, Money, StatusBadge, type Column } from '@/components/ui'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getRecentOrders } from '@/services/orderService'
import type { AdminOrder } from '@/types'
import { formatNumber, paymentName, timeAgo } from '@/utils'
import { TableHeading } from './TableHeading'

export function RecentOrdersTable({ className }: { className?: string }) {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => getRecentOrders(8), [])

  const columns: Column<AdminOrder>[] = [
    {
      id: 'order',
      header: t('dashboard.recentOrders.order'),
      mobile: 'title',
      hideable: false,
      cell: (o) => (
        <span dir="ltr" className="font-medium text-ink tabular-nums">
          {o.number}
        </span>
      ),
    },
    { id: 'customer', header: t('common.customer'), mobile: 'subtitle', hideable: false, cell: (o) => <span className="block max-w-44 truncate">{o.customerName}</span> },
    { id: 'date', header: t('common.date'), mobile: 'meta', hideable: false, cell: (o) => <span className="whitespace-nowrap text-muted">{timeAgo(o.createdAt, lang)}</span> },
    { id: 'items', header: t('common.items'), align: 'end', mobile: 'meta', hideable: false, cell: (o) => <span className="tabular-nums">{formatNumber(o.items.reduce((s, i) => s + i.quantity, 0))}</span> },
    { id: 'total', header: t('common.total'), align: 'end', mobile: 'end', hideable: false, cell: (o) => <Money value={o.total} className="font-medium" /> },
    { id: 'payment', header: t('dashboard.recentOrders.payment'), mobile: 'meta', hideable: false, cell: (o) => <span className="whitespace-nowrap text-muted">{paymentName(o.paymentMethod, lang)}</span> },
    { id: 'status', header: t('common.status'), mobile: 'end', hideable: false, cell: (o) => <StatusBadge status={o.status} /> },
  ]

  return (
    <DataTable
      className={className}
      dense
      columns={columns}
      rows={data}
      rowKey={(o) => o.id}
      loading={loading}
      error={error}
      onRetry={reload}
      onRowClick={(o) => navigate(`/orders/${o.id}`)}
      toolbar={<TableHeading title={t('dashboard.recentOrders.title')} description={t('dashboard.recentOrders.description')} to="/orders" />}
      empty={<EmptyState title={t('dashboard.recentOrders.empty')} />}
    />
  )
}
