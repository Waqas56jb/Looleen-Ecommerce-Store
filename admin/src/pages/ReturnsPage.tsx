import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Download, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, DataTable, EmptyState, Money, PageHeader, SearchInput, Segmented, StatusBadge, Thumb, type Column } from '@/components/ui'
import { StatChips } from '@/components/orders/StatChips'
import { useReasonLabel } from '@/components/returns/useReasonLabel'
import { useAsync, useDebounce, useDocumentTitle, useListState } from '@/hooks'
import { useT } from '@/i18n'
import { getReturns, getReturnStats } from '@/services/moderationService'
import type { ReturnRequest, ReturnStatus } from '@/types'
import { downloadCsv, formatDate } from '@/utils'

const STATUSES: ReturnStatus[] = ['requested', 'approved', 'pickup_scheduled', 'received', 'refunded', 'rejected']

export default function ReturnsPage() {
  const { t, lang } = useT()
  useDocumentTitle(t('orders.returns.title'))
  const navigate = useNavigate()
  const reasonLabel = useReasonLabel()
  const list = useListState({ sortBy: 'createdAt', sortDir: 'desc' })
  const status = list.filter('status') as ReturnStatus | ''
  const [search, setSearch] = useState(list.search)
  const debounced = useDebounce(search, 300)
  const [exporting, setExporting] = useState(false)

  useEffect(() => setSearch(list.search), [list.search])
  useEffect(() => {
    if (debounced !== list.search) list.setSearch(debounced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const filters = { status: status || undefined }
  const { data, loading, error, reload } = useAsync(() => getReturns({ ...list.query, filters }), [list.query, status])
  const stats = useAsync(() => getReturnStats(), [])

  const exportCsv = async () => {
    setExporting(true)
    try {
      const res = await getReturns({ ...list.query, page: 1, pageSize: 10000, filters })
      downloadCsv(
        'returns',
        res.items.map((r) => ({ Return: r.number, Order: r.orderNumber, Customer: r.customerName, Product: r.productName, Quantity: r.quantity, Reason: r.reason, Amount: r.amount, Status: r.status, Date: r.createdAt })),
      )
      toast.success(t('common.exported', { count: res.items.length }))
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<ReturnRequest>[] = [
    {
      id: 'number',
      header: t('orders.returns.col.id'),
      sortKey: 'number',
      mobile: 'title',
      cell: (r) => (
        <span dir="ltr" className="font-semibold tabular-nums">
          {r.number}
        </span>
      ),
    },
    {
      id: 'order',
      header: t('orders.returns.col.order'),
      mobile: 'meta',
      cell: (r) => (
        <Link to={`/orders/${r.orderId}`} dir="ltr" className="text-ink underline-offset-2 hover:text-rose-dark hover:underline">
          {r.orderNumber}
        </Link>
      ),
    },
    { id: 'customer', header: t('orders.returns.col.customer'), sortKey: 'customerName', mobile: 'subtitle', cell: (r) => <span className="font-medium">{r.customerName}</span> },
    {
      id: 'product',
      header: t('orders.returns.col.product'),
      mobile: 'meta',
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Thumb src={r.productImage} alt={r.productName} size="xs" className="max-md:hidden" />
          <span className="line-clamp-2 max-w-56 text-[13px]">{r.productName}</span>
        </div>
      ),
    },
    { id: 'reason', header: t('orders.returns.col.reason'), mobile: 'meta', cell: (r) => <span className="text-muted">{reasonLabel(r.reason)}</span> },
    { id: 'amount', header: t('orders.returns.col.amount'), sortKey: 'amount', align: 'end', mobile: 'end', cell: (r) => <Money value={r.amount} className="font-semibold" /> },
    { id: 'status', header: t('orders.returns.col.status'), mobile: 'end', cell: (r) => <StatusBadge status={r.status} /> },
    { id: 'date', header: t('orders.returns.col.date'), sortKey: 'createdAt', mobile: 'meta', cell: (r) => <span className="whitespace-nowrap text-muted">{formatDate(r.createdAt, lang)}</span> },
  ]

  const s = stats.data
  const chips = [
    { key: 'requested', label: t('orders.returns.stats.requested'), value: s?.requested, dot: 'bg-warning' },
    { key: 'approved', label: t('orders.returns.stats.approved'), value: s?.approved, dot: 'bg-success' },
    { key: 'pickup_scheduled', label: t('orders.returns.stats.pickup'), value: s?.pickup, dot: 'bg-info' },
    { key: 'received', label: t('orders.returns.stats.received'), value: s?.received, dot: 'bg-champagne' },
    { key: 'refunded', label: t('orders.returns.stats.refunded'), value: s?.refunded, dot: 'bg-error' },
    { key: 'rejected', label: t('orders.returns.stats.rejected'), value: s?.rejected, dot: 'bg-subtle' },
  ]

  return (
    <>
      <PageHeader
        title={t('orders.returns.title')}
        description={t('orders.returns.description')}
        breadcrumbs={[{ label: t('nav.returns') }]}
        actions={
          <Button variant="outline" icon={<Download className="size-4" />} onClick={exportCsv} loading={exporting}>
            {t('common.exportCsv')}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto]">
        <StatChips className="sm:grid-cols-3 xl:grid-cols-6" items={chips} active={status} loading={stats.loading} onSelect={(k) => list.setFilter('status', k === status ? undefined : k)} />
        <div className="card flex flex-col justify-center px-4 py-3 xl:min-w-52">
          <span className="text-[12.5px] font-medium text-muted">{t('orders.returns.stats.refundedAmount')}</span>
          <span className="mt-1.5 text-xl font-semibold tracking-tight text-ink">{s ? <Money value={s.refundedAmount} /> : '—'}</span>
        </div>
      </div>

      <DataTable
        tableId="returns"
        columns={columns}
        rows={data?.items}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        onRetry={reload}
        total={data?.total}
        page={data?.page ?? list.page}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        sortBy={list.sortBy}
        sortDir={list.sortDir}
        onSort={list.setSort}
        onRowClick={(r) => navigate(`/returns/${r.id}`)}
        toolbar={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder={t('orders.returns.searchPlaceholder')} className="w-full sm:w-72" />
            <Segmented
              size="sm"
              value={status || 'all'}
              onChange={(v) => list.setFilter('status', v === 'all' ? undefined : v)}
              options={[{ value: 'all', label: t('common.all') }, ...STATUSES.map((st) => ({ value: st, label: t(`status.${st}`) }))]}
            />
          </>
        }
        empty={<EmptyState icon={<Undo2 />} title={t('orders.returns.empty.title')} description={t('orders.returns.empty.desc')} />}
      />
    </>
  )
}
