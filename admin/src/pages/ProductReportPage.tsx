import type { ReactNode } from 'react'
import { Eye, MousePointerClick, PackageX, ShoppingCart, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { stockLevel } from '@/components/dashboard/LowStockCard'
import { RankedList, type RankedItem } from '@/components/reports/RankedList'
import { PrintHeader, ReportToolbar, useRangeLabel } from '@/components/reports/ReportToolbar'
import { useReportRange } from '@/components/reports/useReportRange'
import { Money, PageHeader, StatusBadge } from '@/components/ui'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getTopProducts, type TopProduct } from '@/services/analyticsService'
import { getInventory, type InventoryRow } from '@/services/inventoryService'
import type { DateRange } from '@/types'
import { downloadCsv, formatNumber } from '@/utils'

type Order = 'best' | 'worst' | 'views' | 'carts' | 'conversion'
const LIMIT = 8

async function loadRankings(ds: DateRange) {
  const [best, worst, views, carts, conversion] = await Promise.all((['best', 'worst', 'views', 'carts', 'conversion'] as Order[]).map((o) => getTopProducts(LIMIT, ds, o)))
  return { best, worst, views, carts, conversion }
}

export default function ProductReportPage() {
  const { t } = useT()
  useDocumentTitle(t('reports.products.title'))
  const range = useReportRange()
  const rangeLabel = useRangeLabel(range)
  const ds = range.dataset

  const rank = useAsync(() => loadRankings(ds), [ds])
  const low = useAsync(() => getInventory({ filters: { status: 'low_stock' }, pageSize: 50, sortBy: 'available', sortDir: 'asc' }), [])
  const out = useAsync(() => getInventory({ filters: { status: 'out_of_stock' }, pageSize: 50 }), [])

  const toItem = (p: TopProduct, value: ReactNode, secondary?: ReactNode): RankedItem => ({
    id: p.id,
    to: `/products/${p.id}`,
    image: p.image,
    title: p.name,
    subtitle: `${p.brandName} · ${p.category}`,
    value,
    secondary,
  })
  const pct = (v: number) => <span dir="ltr">{v.toFixed(1)}%</span>
  const r = rank.data

  const stockItem = (row: InventoryRow): RankedItem => ({
    id: row.productId,
    to: `/inventory/${row.productId}`,
    image: row.image,
    title: row.name,
    subtitle: (
      <span dir="ltr" className="font-mono">
        {row.sku}
      </span>
    ),
    value: (
      <span className="inline-flex items-center gap-2">
        {row.status === 'low_stock' && <StatusBadge status={stockLevel(row)} />}
        {formatNumber(row.stock)}
      </span>
    ),
    secondary: `${t('reports.products.threshold')}: ${formatNumber(row.threshold)}`,
  })

  const exportCsv = () => {
    if (!r) return
    const lists: [string, TopProduct[]][] = [
      ['Top products', r.best],
      ['Worst performing', r.worst],
      ['Most viewed', r.views],
      ['Most added to cart', r.carts],
      ['Best conversion', r.conversion],
    ]
    const rows: Record<string, unknown>[] = lists.flatMap(([list, items]) =>
      items.map((p, i) => ({
        List: list,
        Rank: i + 1,
        Product: p.name,
        Brand: p.brandName,
        Category: p.category,
        'Units Sold': p.unitsSold,
        'Revenue (SAR)': p.revenue,
        Views: p.views,
        'Add to Carts': p.addToCarts,
        'Conversion %': p.conversion,
        Stock: p.stock,
      })),
    )
    const stock = [...(low.data?.items ?? []), ...(out.data?.items ?? [])]
    stock.forEach((s) =>
      rows.push({ List: s.status === 'out_of_stock' ? 'Out of stock' : 'Low stock', Rank: '', Product: s.name, Brand: s.brandName, Category: '', 'Units Sold': '', 'Revenue (SAR)': '', Views: '', 'Add to Carts': '', 'Conversion %': '', Stock: s.stock }),
    )
    downloadCsv(`product-report-${ds}`, rows)
    toast.success(t('common.exported', { count: rows.length }))
  }

  const common = { loading: rank.loading, error: rank.error, onRetry: rank.reload }

  return (
    <div className="report-print">
      <PageHeader
        title={t('reports.products.title')}
        description={t('reports.products.description')}
        breadcrumbs={[{ label: t('nav.reports'), to: `/reports${range.search}` }, { label: t('reports.products.title') }]}
      />
      <PrintHeader title={t('reports.products.title')} rangeLabel={rangeLabel} />
      <ReportToolbar range={range} onExportCsv={exportCsv} onPrint={() => window.print()} />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RankedList
            {...common}
            icon={<TrendingUp />}
            title={t('reports.products.best')}
            description={t('reports.products.bestDesc')}
            valueLabel={t('reports.products.revenue')}
            secondaryLabel={t('reports.products.units')}
            items={r?.best.map((p) => toItem(p, <Money value={p.revenue} />, formatNumber(p.unitsSold)))}
          />
          <RankedList
            {...common}
            icon={<TrendingDown />}
            title={t('reports.products.worst')}
            description={t('reports.products.worstDesc')}
            valueLabel={t('reports.products.revenue')}
            secondaryLabel={t('reports.products.units')}
            items={r?.worst.map((p) => toItem(p, <Money value={p.revenue} />, formatNumber(p.unitsSold)))}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <RankedList
            {...common}
            icon={<Eye />}
            title={t('reports.products.views')}
            description={t('reports.products.viewsDesc')}
            valueLabel={t('reports.products.viewsCol')}
            secondaryLabel={t('reports.products.conversionCol')}
            items={r?.views.map((p) => toItem(p, formatNumber(p.views), pct(p.conversion)))}
          />
          <RankedList
            {...common}
            icon={<ShoppingCart />}
            title={t('reports.products.carts')}
            description={t('reports.products.cartsDesc')}
            valueLabel={t('reports.products.cartsCol')}
            secondaryLabel={t('reports.products.viewsCol')}
            items={r?.carts.map((p) => toItem(p, formatNumber(p.addToCarts), formatNumber(p.views)))}
          />
          <RankedList
            {...common}
            icon={<MousePointerClick />}
            title={t('reports.products.conversion')}
            description={t('reports.products.conversionDesc')}
            valueLabel={t('reports.products.conversionCol')}
            secondaryLabel={t('reports.products.units')}
            items={r?.conversion.map((p) => toItem(p, pct(p.conversion), formatNumber(p.unitsSold)))}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RankedList
            icon={<TriangleAlert />}
            title={`${t('reports.products.lowStock')}${low.data ? ` (${low.data.total})` : ''}`}
            description={t('reports.products.lowStockDesc')}
            valueLabel={t('reports.products.stock')}
            emptyLabel={t('reports.products.noneLow')}
            loading={low.loading}
            error={low.error}
            onRetry={low.reload}
            maxHeight
            items={low.data?.items.map(stockItem)}
          />
          <RankedList
            icon={<PackageX />}
            title={`${t('reports.products.outOfStock')}${out.data ? ` (${out.data.total})` : ''}`}
            description={t('reports.products.outOfStockDesc')}
            valueLabel={t('reports.products.stock')}
            emptyLabel={t('reports.products.noneOut')}
            loading={out.loading}
            error={out.error}
            onRetry={out.reload}
            maxHeight
            items={out.data?.items.map(stockItem)}
          />
        </div>
      </div>
    </div>
  )
}
