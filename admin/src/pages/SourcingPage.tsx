import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ClipboardCheck, Download, PackageSearch, Scale, Settings2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button, ButtonLink, Card, DataTable, EmptyState, Money, PageHeader, SearchInput, Segmented, Select, StatCard, type Column } from '@/components/ui'
import { useDebouncedSearch } from '@/components/marketing/shared'
import { BrandTile, Pct, RetailerProgress, SourcingStatusBadge } from '@/components/sourcing/shared'
import { displayName } from '@/components/sourcing/format'
import { useAsync, useDocumentTitle, useListState } from '@/hooks'
import { useT } from '@/i18n'
import { getRules, getSourcingRows, getSourcingStats } from '@/services/sourcingService'
import type { SourcingRow, SourcingStatus } from '@/types/sourcing'
import { downloadCsv, formatNumber } from '@/utils'

const STATUSES: ('all' | SourcingStatus)[] = ['all', 'incomplete', 'ready', 'approved', 'rejected']

export default function SourcingPage() {
  const { t } = useT()
  const navigate = useNavigate()
  const S = (k: string, v?: Record<string, string | number>) => t(`sourcing.list.${k}`, v)
  useDocumentTitle(S('title'))
  const ls = useListState({ sortBy: 'retailers', sortDir: 'desc' })
  const [searchDraft, setSearchDraft] = useDebouncedSearch(ls.search, ls.setSearch)
  const status = (ls.filter('status') || 'all') as 'all' | SourcingStatus
  const brand = ls.filter('brand')
  const filters = useMemo(() => ({ status: status === 'all' ? undefined : status, brand: brand || undefined }), [status, brand])

  const list = useAsync(() => getSourcingRows({ ...ls.query, filters }), [ls.query, filters])
  const stats = useAsync(() => getSourcingStats(), [])
  const rules = useAsync(() => getRules(), [])
  const min = rules.data?.minRetailers ?? 4

  const exportCsv = async () => {
    const res = await getSourcingRows({ ...ls.query, page: 1, pageSize: 10000, filters })
    downloadCsv(
      'looks-product-approval',
      res.items.map((r) => ({
        'LOOKS ID': r.id,
        Brand: r.brand,
        Product: displayName(r),
        Barcode: r.barcode,
        Supplier: r.supplierName,
        'Supplier code': r.offers.map((o) => o.code).join(' / '),
        'Supplier cost (SAR excl. VAT)': r.cost ?? '',
        'Retailers verified': r.market.fresh,
        'Retailers required': min,
        'Lowest (SAR incl. VAT)': r.market.min ?? '',
        'Lowest at': r.market.lowestAt ?? '',
        'Average (SAR incl. VAT)': r.market.avg ?? '',
        'Highest (SAR incl. VAT)': r.market.max ?? '',
        'Margin at average': r.marginAtAvg === null ? '' : `${(r.marginAtAvg * 100).toFixed(1)}%`,
        'LOOKS price (SAR incl. VAT)': r.looksPrice ?? '',
        Status: t(`sourcing.status.${r.status}`),
      })),
    )
    toast.success(t('common.exported', { count: res.items.length }))
  }

  const columns: Column<SourcingRow>[] = [
    {
      id: 'product',
      header: S('cols.product'),
      sortKey: 'nameEn',
      mobile: 'title',
      hideable: false,
      cell: (r) => (
        <div className="flex min-w-64 items-center gap-3">
          <BrandTile brand={r.brand} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-ink">{displayName(r)}</p>
            <p className="truncate text-xs text-muted" dir="ltr">
              {r.id} · {r.barcode || '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'cost',
      header: S('cols.supplierCost'),
      sortKey: 'cost',
      align: 'end',
      mobile: 'meta',
      cell: (r) =>
        r.cost !== null ? (
          <div className="text-end">
            <Money value={r.cost} className="font-medium" />
            <p className="text-[11px] text-subtle">{r.supplierName}</p>
          </div>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    { id: 'retailers', header: S('cols.retailers'), sortKey: 'retailers', mobile: 'meta', cell: (r) => <RetailerProgress count={r.market.fresh} min={min} /> },
    { id: 'lowest', header: S('cols.lowest'), align: 'end', cell: (r) => (r.market.min !== null ? <Money value={r.market.min} /> : <span className="text-subtle">—</span>) },
    { id: 'avg', header: S('cols.average'), sortKey: 'avg', align: 'end', cell: (r) => (r.market.avg !== null ? <Money value={r.market.avg} /> : <span className="text-subtle">—</span>) },
    { id: 'margin', header: S('cols.margin'), sortKey: 'margin', align: 'end', cell: (r) => <Pct value={r.marginAtAvg} /> },
    { id: 'looks', header: S('cols.looksPrice'), align: 'end', cell: (r) => (r.looksPrice ? <Money value={r.looksPrice} className="font-medium" /> : <span className="text-xs text-subtle">{S('notSet')}</span>) },
    { id: 'status', header: S('cols.status'), sortKey: 'status', mobile: 'end', cell: (r) => <SourcingStatusBadge status={r.status} short /> },
  ]

  const s = stats.data
  return (
    <>
      <PageHeader
        title={S('title')}
        description={S('description', { min })}
        breadcrumbs={[{ label: t('nav.sourcing') }, { label: S('title') }]}
        actions={
          <>
            <Button variant="outline" icon={<Download className="size-4" />} onClick={exportCsv}>
              {t('common.exportCsv')}
            </Button>
            <ButtonLink to="/sourcing/rules" variant="outline" icon={<Settings2 className="size-4" />}>
              {S('rules')}
            </ButtonLink>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={S('stats.total')} value={s ? formatNumber(s.total) : '—'} icon={<PackageSearch />} loading={!s} period={s ? S('stats.totalHint', { count: s.retailerPrices }) : undefined} />
        <StatCard label={S('stats.incomplete')} value={s ? formatNumber(s.incomplete) : '—'} icon={<XCircle />} tone="warning" loading={!s} period={S('stats.incompleteHint')} />
        <StatCard label={S('stats.ready')} value={s ? formatNumber(s.ready) : '—'} icon={<Scale />} loading={!s} period={S('stats.readyHint')} />
        <StatCard label={S('stats.approved')} value={s ? formatNumber(s.approved) : '—'} icon={<CheckCircle2 />} tone="success" loading={!s} period={s ? S('stats.approvedHint', { count: s.rejected }) : undefined} />
      </div>

      <DataTable
        tableId="sourcing"
        columns={columns}
        rows={list.data?.items}
        rowKey={(r) => r.id}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        total={list.data?.total}
        page={ls.page}
        pageSize={ls.pageSize}
        onPageChange={ls.setPage}
        onPageSizeChange={ls.setPageSize}
        sortBy={ls.sortBy}
        sortDir={ls.sortDir}
        onSort={ls.setSort}
        onRowClick={(r) => navigate(`/sourcing/${r.id}`)}
        toolbar={
          <>
            <SearchInput value={searchDraft} onChange={setSearchDraft} placeholder={S('search')} className="w-full sm:w-72" />
            <Segmented size="sm" value={status} onChange={(v) => ls.setFilter('status', v === 'all' ? undefined : v)} options={STATUSES.map((v) => ({ value: v, label: v === 'all' ? t('common.all') : t(`sourcing.statusShort.${v}`) }))} />
            <Select aria-label={S('allBrands')} value={brand} onChange={(e) => ls.setFilter('brand', e.target.value || undefined)} placeholder={S('allBrands')} options={(s?.brands ?? []).map((b) => ({ value: b, label: b }))} wrapperClassName="w-full sm:w-48" />
          </>
        }
        empty={<EmptyState icon={<ClipboardCheck />} title={S('emptyTitle')} description={S('emptyDesc')} />}
      />

      <Card title={S('howTitle')} className="mt-6">
        <ol className="list-decimal space-y-1.5 ps-5 text-[13px] leading-relaxed text-muted marker:text-ink">
          <li>{S('how1')}</li>
          <li>{S('how2', { min, days: rules.data?.maxPriceAgeDays ?? 30 })}</li>
          <li>{S('how3')}</li>
        </ol>
      </Card>
    </>
  )
}
