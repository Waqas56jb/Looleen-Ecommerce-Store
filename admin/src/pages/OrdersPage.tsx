import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { Button, ConfirmDialog, DataTable, EmptyState, Money, PageHeader, Select, StatusBadge, type Column } from '@/components/ui'
import { OrderFilters, ORDER_FILTER_KEYS } from '@/components/orders/OrderFilters'
import { OrderRowActions } from '@/components/orders/OrderRowActions'
import { itemCount, resolveStatusParam, STATUS_GROUPS } from '@/components/orders/orderUtils'
import { StatChips } from '@/components/orders/StatChips'
import { UpdateStatusModal } from '@/components/orders/UpdateStatusModal'
import { useStatusWord } from '@/components/orders/useStatusLabel'
import { useAsync, useDocumentTitle, useListState } from '@/hooks'
import { useT } from '@/i18n'
import { bulkUpdateOrderStatus, getOrders, getOrderStats, ORDER_FLOW, type OrderFilters as Filters } from '@/services/orderService'
import type { AdminOrder, OrderStatus, PaymentMethodId, ShippingMethod } from '@/types'
import { cityName, downloadCsv, formatDateTime, paymentName } from '@/utils'

const BULK_STATUSES: OrderStatus[] = [...ORDER_FLOW.slice(1), 'cancelled']

export default function OrdersPage() {
  const { t, lang } = useT()
  const word = useStatusWord()
  useDocumentTitle(t('orders.title'))
  const navigate = useNavigate()
  const list = useListState({ sortBy: 'createdAt', sortDir: 'desc' })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<OrderStatus | ''>('')
  const [bulkConfirm, setBulkConfirm] = useState<{ ids: string[]; clear: () => void } | null>(null)
  const [statusTarget, setStatusTarget] = useState<{ order: AdminOrder; status?: OrderStatus } | null>(null)
  const [exporting, setExporting] = useState(false)

  const statusParam = list.filter('status')
  const filters = useMemo<Filters>(() => {
    const num = (k: string) => (list.filter(k) !== '' && !Number.isNaN(Number(list.filter(k))) ? Number(list.filter(k)) : undefined)
    return {
      status: resolveStatusParam(list.filterList('status')),
      paymentMethod: list.filterList('payment') as PaymentMethodId[],
      shippingMethod: (list.filter('shipping') || undefined) as ShippingMethod | undefined,
      from: list.filter('from') || undefined,
      to: list.filter('to') || undefined,
      minTotal: num('min'),
      maxTotal: num('max'),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.params])

  const { data, loading, error, reload } = useAsync(() => getOrders({ ...list.query, filters }), [list.query, filters])
  const stats = useAsync(() => getOrderStats(), [])
  const refresh = () => {
    reload()
    stats.reload()
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const res = await getOrders({ ...list.query, page: 1, pageSize: 10000, filters })
      downloadCsv(
        'orders',
        res.items.map((o) => ({
          Order: o.number,
          Date: o.createdAt,
          Customer: o.customerName,
          Email: o.customerEmail,
          Phone: o.customerPhone,
          City: cityName(o.address.city, 'en'),
          Items: itemCount(o),
          Subtotal: o.subtotal,
          Discount: o.discount,
          Coupon: o.couponCode ?? '',
          VAT: o.vat,
          Shipping: o.shipping,
          Total: o.total,
          'Payment method': paymentName(o.paymentMethod, 'en'),
          'Payment status': o.paymentStatus,
          'Shipping method': o.shippingMethod,
          Carrier: o.carrier ?? '',
          Tracking: o.trackingNumber ?? '',
          Status: o.status,
        })),
      )
      toast.success(t('common.exported', { count: res.items.length }))
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<AdminOrder>[] = [
    {
      id: 'number',
      header: t('orders.col.order'),
      mobile: 'title',
      cell: (o) => (
        <span dir="ltr" className="font-semibold text-ink tabular-nums">
          {o.number}
        </span>
      ),
    },
    {
      id: 'customer',
      header: t('orders.col.customer'),
      sortKey: 'customerName',
      mobile: 'subtitle',
      cell: (o) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{o.customerName}</p>
          <p className="text-xs text-muted">{cityName(o.address.city, lang)}</p>
        </div>
      ),
    },
    { id: 'date', header: t('orders.col.date'), sortKey: 'createdAt', mobile: 'meta', cell: (o) => <span className="whitespace-nowrap text-muted">{formatDateTime(o.createdAt, lang)}</span> },
    { id: 'items', header: t('orders.col.items'), sortKey: 'items', align: 'center', mobile: 'meta', cell: (o) => <span className="tabular-nums">{itemCount(o)}</span> },
    { id: 'total', header: t('orders.col.total'), sortKey: 'total', align: 'end', mobile: 'end', cell: (o) => <Money value={o.total} className="font-semibold" /> },
    {
      id: 'payment',
      header: t('orders.col.payment'),
      mobile: 'meta',
      cell: (o) => (
        <div className="flex flex-col items-start gap-1">
          <span className="text-[13px] whitespace-nowrap">{paymentName(o.paymentMethod, lang)}</span>
          <StatusBadge status={o.paymentStatus} />
        </div>
      ),
    },
    { id: 'shipping', header: t('orders.col.shipping'), mobile: 'meta', cell: (o) => <span className="whitespace-nowrap text-muted">{t(`orders.shippingShort.${o.shippingMethod}`)}</span> },
    { id: 'status', header: t('orders.col.status'), mobile: 'end', cell: (o) => <StatusBadge status={o.status} /> },
    { id: 'actions', header: <span className="sr-only">{t('common.actions')}</span>, hideable: false, align: 'end', width: '56px', cell: (o) => <OrderRowActions order={o} onStatus={(order, status) => setStatusTarget({ order, status })} /> },
  ]

  const s = stats.data
  const chipItems = [
    { key: '', label: t('orders.stats.total'), value: s?.total, dot: 'bg-ink' },
    { key: 'pending', label: t('orders.stats.pending'), value: s?.pending, dot: 'bg-warning' },
    { key: 'processing', label: t('orders.stats.processing'), value: s?.processing, dot: 'bg-info' },
    { key: 'shipped', label: t('orders.stats.shipped'), value: s?.shipped, dot: 'bg-rose' },
    { key: 'delivered', label: t('orders.stats.delivered'), value: s?.delivered, dot: 'bg-success' },
    { key: 'cancelled', label: t('orders.stats.cancelled'), value: s?.cancelled, dot: 'bg-subtle' },
    { key: 'refunded', label: t('orders.stats.refunded'), value: s?.refunded, dot: 'bg-error' },
  ]
  const activeChip = statusParam === '' ? '' : STATUS_GROUPS[statusParam] || chipItems.some((c) => c.key === statusParam) ? statusParam : '__custom'

  const runBulk = async () => {
    if (!bulkConfirm || !bulkStatus) return
    try {
      const n = await bulkUpdateOrderStatus(bulkConfirm.ids, bulkStatus)
      toast.success(t('orders.bulk.done', { count: n, status: word(bulkStatus) }))
      bulkConfirm.clear()
      setBulkStatus('')
      refresh()
    } catch {
      toast.error(t('orders.toast.error'))
    }
  }

  return (
    <>
      <PageHeader
        title={t('orders.title')}
        description={t('orders.description')}
        breadcrumbs={[{ label: t('nav.orders') }]}
        actions={
          <Button variant="outline" icon={<Download className="size-4" />} onClick={exportCsv} loading={exporting}>
            {t('common.exportCsv')}
          </Button>
        }
      />

      <StatChips className="mb-6" items={chipItems} active={activeChip} loading={stats.loading} onSelect={(key) => list.setFilter('status', key || undefined)} />

      <DataTable
        tableId="orders"
        columns={columns}
        rows={data?.items}
        rowKey={(o) => o.id}
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
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        onRowClick={(o) => navigate(`/orders/${o.id}`)}
        toolbar={<OrderFilters list={list} />}
        bulkActions={(ids, clear) => (
          <>
            <Select aria-label={t('orders.bulk.choose')} value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as OrderStatus)} placeholder={t('orders.bulk.choose')} options={BULK_STATUSES.map((st) => ({ value: st, label: t(`status.${st}`) }))} className="h-8 text-[13px]" wrapperClassName="w-48" />
            <Button size="sm" disabled={!bulkStatus} onClick={() => setBulkConfirm({ ids, clear })}>
              {t('orders.bulk.apply')}
            </Button>
          </>
        )}
        empty={
          <EmptyState
            icon={<ShoppingBag />}
            title={t('orders.empty.title')}
            description={t('orders.empty.desc')}
            action={ORDER_FILTER_KEYS.some((k) => list.filter(k)) || list.search ? { label: t('common.clearAll'), onClick: () => list.clearFilters([...ORDER_FILTER_KEYS, 'q']) } : undefined}
          />
        }
      />

      <ConfirmDialog
        open={!!bulkConfirm}
        onClose={() => setBulkConfirm(null)}
        onConfirm={runBulk}
        tone={bulkStatus === 'cancelled' ? 'danger' : 'default'}
        title={t('orders.bulk.confirmTitle', { count: bulkConfirm?.ids.length ?? 0 })}
        description={t('orders.bulk.confirmDesc', { status: bulkStatus ? word(bulkStatus) : '' })}
        confirmLabel={t('orders.bulk.apply')}
      />

      <UpdateStatusModal order={statusTarget?.order ?? null} initialStatus={statusTarget?.status} open={!!statusTarget} onClose={() => setStatusTarget(null)} onDone={refresh} />
    </>
  )
}
