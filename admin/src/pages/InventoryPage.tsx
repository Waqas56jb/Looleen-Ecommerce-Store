import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertTriangle, Boxes, Download, Eye, History, MoreHorizontal, PackageX, SlidersHorizontal, Wallet } from 'lucide-react'
import { StockAdjustModal, type AdjustTarget } from '@/components/inventory/StockAdjustModal'
import { Button, DataTable, Dropdown, EmptyState, IconButton, Money, PageHeader, SearchInput, Segmented, StatCard, StatusBadge, Thumb, type Column } from '@/components/ui'
import { useAsync, useDocumentTitle, useListState } from '@/hooks'
import { useT } from '@/i18n'
import { getInventory, getInventoryStats, type InventoryRow } from '@/services/inventoryService'
import type { InventoryStatus } from '@/types'
import { cn, downloadCsv, formatDate, formatNumber, formatPrice } from '@/utils'

const STATUSES: InventoryStatus[] = ['in_stock', 'low_stock', 'out_of_stock']

export default function InventoryPage() {
  const { t, lang } = useT()
  useDocumentTitle(t('products.inventory.title'))
  const navigate = useNavigate()
  const list = useListState({ sortBy: 'available', sortDir: 'asc' })
  const rawStatus = list.filter('status')
  const status = (STATUSES as string[]).includes(rawStatus) ? (rawStatus as InventoryStatus) : undefined

  const { data, loading, error, reload } = useAsync(() => getInventory({ ...list.query, filters: { status } }), [list.query, status])
  const stats = useAsync(() => getInventoryStats(), [])
  const [adjust, setAdjust] = useState<AdjustTarget | null>(null)
  const [exporting, setExporting] = useState(false)

  const exportCsv = async () => {
    setExporting(true)
    try {
      const res = await getInventory({ search: list.search, sortBy: list.sortBy, sortDir: list.sortDir, filters: { status }, page: 1, pageSize: 10000 })
      if (!res.items.length) return
      downloadCsv(
        'inventory',
        res.items.map((r) => ({
          'Product ID': r.productId,
          Product: r.name,
          Brand: r.brandName,
          SKU: r.sku,
          Stock: r.stock,
          Reserved: r.reserved,
          Available: r.available,
          Threshold: r.threshold,
          Status: r.status,
          'Cost (SAR)': r.costPrice,
          'Value at cost (SAR)': r.value,
          'Last updated': r.lastUpdated,
        })),
      )
      toast.success(t('common.exported', { count: res.items.length }))
    } finally {
      setExporting(false)
    }
  }

  const num = (v: number, cls?: string) => <span className={cn('tabular-nums', cls)}>{formatNumber(v)}</span>

  const columns: Column<InventoryRow>[] = [
    {
      id: 'product',
      header: t('products.inventory.col.product'),
      sortKey: 'name',
      mobile: 'title',
      hideable: false,
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          <Thumb src={r.image} alt={r.name} size="sm" />
          <div className="min-w-0">
            <p className="max-w-[18rem] truncate font-medium text-ink">{r.name}</p>
            <p className="text-xs text-muted">{r.brandName}</p>
          </div>
        </div>
      ),
    },
    { id: 'sku', header: t('products.inventory.col.sku'), sortKey: 'sku', mobile: 'subtitle', cell: (r) => <span className="font-mono text-xs text-muted" dir="ltr">{r.sku}</span> },
    { id: 'stock', header: t('products.inventory.col.stock'), sortKey: 'stock', align: 'end', mobile: 'meta', cell: (r) => num(r.stock, cn('font-medium', r.status === 'out_of_stock' ? 'text-error' : r.status === 'low_stock' ? 'text-warning' : 'text-ink')) },
    { id: 'reserved', header: t('products.inventory.col.reserved'), sortKey: 'reserved', align: 'end', mobile: 'meta', cell: (r) => num(r.reserved, 'text-muted') },
    { id: 'available', header: t('products.inventory.col.available'), sortKey: 'available', align: 'end', mobile: 'end', cell: (r) => num(r.available, 'font-semibold text-ink') },
    { id: 'threshold', header: t('products.inventory.col.threshold'), sortKey: 'threshold', align: 'end', mobile: 'meta', cell: (r) => num(r.threshold, 'text-muted') },
    { id: 'status', header: t('products.inventory.col.status'), sortKey: 'status', mobile: 'end', cell: (r) => <StatusBadge status={r.status} /> },
    { id: 'lastUpdated', header: t('products.inventory.col.lastUpdated'), sortKey: 'lastUpdated', mobile: 'meta', cell: (r) => <span className="whitespace-nowrap text-muted">{formatDate(r.lastUpdated, lang)}</span> },
    {
      id: 'actions',
      header: <span className="sr-only">{t('common.actions')}</span>,
      align: 'end',
      hideable: false,
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="outline" className="max-md:hidden" icon={<SlidersHorizontal className="size-3.5" />} onClick={() => setAdjust(r)}>
            {t('products.inventory.adjust')}
          </Button>
          <Dropdown
            trigger={({ toggle }) => (
              <IconButton label={t('products.actions.more')} size="sm" onClick={toggle}>
                <MoreHorizontal />
              </IconButton>
            )}
            items={[
              { label: t('products.inventory.adjust'), icon: <SlidersHorizontal />, onClick: () => setAdjust(r) },
              { label: t('products.inventory.view'), icon: <History />, onClick: () => navigate(`/inventory/${r.productId}`) },
              { label: t('products.actions.view'), icon: <Eye />, onClick: () => navigate(`/products/${r.productId}`) },
            ]}
          />
        </div>
      ),
    },
  ]

  const st = stats.data
  const toggleStatus = (s: InventoryStatus) => list.setFilter('status', status === s ? undefined : s)

  return (
    <>
      <PageHeader
        title={t('products.inventory.title')}
        description={t('products.inventory.description')}
        breadcrumbs={[{ label: t('nav.catalog') }, { label: t('products.inventory.title') }]}
        actions={
          <Button variant="outline" icon={<Download className="size-4" />} loading={exporting} onClick={exportCsv}>
            {t('common.exportCsv')}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t('products.inventory.stats.totalUnits')} value={formatNumber(st?.totalUnits ?? 0)} icon={<Boxes />} loading={stats.loading && !st} />
        <StatCard
          label={t('products.inventory.stats.value')}
          value={<Money value={st?.inventoryValue ?? 0} compact />}
          icon={<Wallet />}
          loading={stats.loading && !st}
          period={st ? t('products.inventory.stats.valueHint', { retail: formatPrice(st.retailValue, lang) }) : undefined}
        />
        <button type="button" className={cn('rounded-lg text-start', status === 'low_stock' && 'ring-2 ring-warning/25')} onClick={() => toggleStatus('low_stock')}>
          <StatCard label={t('products.inventory.stats.lowStock')} value={formatNumber(st?.lowStock ?? 0)} icon={<AlertTriangle />} tone="warning" loading={stats.loading && !st} />
        </button>
        <button type="button" className={cn('rounded-lg text-start', status === 'out_of_stock' && 'ring-2 ring-error/25')} onClick={() => toggleStatus('out_of_stock')}>
          <StatCard label={t('products.inventory.stats.outOfStock')} value={formatNumber(st?.outOfStock ?? 0)} icon={<PackageX />} tone="error" loading={stats.loading && !st} />
        </button>
      </div>

      <DataTable
        tableId="inventory"
        columns={columns}
        rows={data?.items}
        rowKey={(r) => r.productId}
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
        onRowClick={(r) => navigate(`/inventory/${r.productId}`)}
        toolbar={
          <>
            <SearchInput value={list.search} onChange={list.setSearch} placeholder={t('products.inventory.searchPlaceholder')} className="w-full sm:w-72" />
            <Segmented<'all' | InventoryStatus>
              value={status ?? 'all'}
              onChange={(v) => list.setFilter('status', v === 'all' ? undefined : v)}
              options={(['all', ...STATUSES] as const).map((v) => ({ value: v, label: t(`products.inventory.segments.${v}`) }))}
            />
          </>
        }
        empty={<EmptyState icon={<Boxes />} title={t('products.inventory.empty')} description={t('products.inventory.emptyDesc')} />}
      />

      <StockAdjustModal
        item={adjust}
        onClose={() => setAdjust(null)}
        onSaved={() => {
          reload()
          stats.reload()
        }}
      />
    </>
  )
}
