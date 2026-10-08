import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, Download, MessageSquareText, Star, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, Badge, Button, ConfirmDialog, DataTable, EmptyState, PageHeader, RatingStars, SearchInput, StatCard, StatusBadge, Tabs, Thumb, type Column } from '@/components/ui'
import { FilterSelect, ResponsiveFilters, useDebouncedSearch } from '@/components/customers/ListFilters'
import { ReviewRowActions, useReviewModeration } from '@/components/reviews/ReviewModeration'
import { useAsync, useDocumentTitle, useListState } from '@/hooks'
import { useT } from '@/i18n'
import { bulkModerateReviews, getReviewStats, getReviews } from '@/services/moderationService'
import { getAllProducts } from '@/services/productService'
import type { AdminReview, ReviewStatus } from '@/types'
import { downloadCsv, formatDate, formatNumber } from '@/utils'

type Tab = 'all' | ReviewStatus
const TABS: Tab[] = ['all', 'pending', 'approved', 'rejected', 'hidden']

export default function ReviewsPage() {
  const { t, lang } = useT()
  useDocumentTitle(t('customers.reviews.title'))
  const navigate = useNavigate()
  const list = useListState({ sortBy: 'createdAt', sortDir: 'desc' })
  const [searchInput, setSearchInput] = useDebouncedSearch(list.search, list.setSearch)
  const statusParam = list.filter('status') as Tab
  const status: Tab = TABS.includes(statusParam) ? statusParam : 'all'
  const ratingParam = Number(list.filter('rating')) || 0
  const rating = ratingParam >= 1 && ratingParam <= 5 ? ratingParam : 0

  const filters = useMemo(() => ({ status: status === 'all' ? undefined : status, rating: rating || undefined }), [status, rating])
  const stats = useAsync(() => getReviewStats(), [])
  const { data, loading, error, reload } = useAsync(() => getReviews({ ...list.query, filters }), [list.query, filters])
  const products = useAsync(() => getAllProducts(), [])
  const images = useMemo(() => new Map((products.data ?? []).map((p) => [p.id, p.images[0]])), [products.data])

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkReject, setBulkReject] = useState<string[] | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [exporting, setExporting] = useState(false)

  const refresh = () => {
    reload()
    stats.reload()
  }
  const mod = useReviewModeration({ onChanged: refresh })
  const s = stats.data

  const bulk = async (ids: string[], next: 'approved' | 'rejected') => {
    setBulkBusy(true)
    try {
      const count = await bulkModerateReviews(ids, next)
      toast.success(t(next === 'approved' ? 'customers.reviews.toast.bulkApproved' : 'customers.reviews.toast.bulkRejected', { count }))
      setSelected(new Set())
      refresh()
    } catch {
      toast.error(t('customers.reviews.toast.failed'))
    } finally {
      setBulkBusy(false)
    }
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const all = await getReviews({ ...list.query, page: 1, pageSize: 10000, filters })
      if (!all.items.length) return
      downloadCsv(
        `reviews-${status}`,
        all.items.map((r) => ({
          ID: r.id,
          Date: formatDate(r.createdAt, lang),
          Customer: r.customerName,
          Product: r.productName,
          Rating: r.rating,
          Title: r.title,
          Review: r.body,
          Verified: r.verified ? 'Yes' : 'No',
          Helpful: r.helpful,
          Status: r.status,
          Reply: r.reply?.text ?? '',
        })),
      )
      toast.success(t('common.exported', { count: all.items.length }))
    } finally {
      setExporting(false)
    }
  }

  const tabCount = (tab: Tab) => (s ? (tab === 'all' ? s.total : s[tab]) : undefined)

  const columns: Column<AdminReview>[] = [
    {
      id: 'customer',
      header: t('customers.reviews.col.customer'),
      mobile: 'subtitle',
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={r.customerName} size="sm" className="max-md:hidden" />
          <Link to={`/customers/${r.customerId}`} className="truncate font-medium text-ink hover:text-rose-dark hover:underline">
            {r.customerName}
          </Link>
          {r.status === 'pending' && <span data-pending className="sr-only" />}
        </div>
      ),
    },
    {
      id: 'product',
      header: t('customers.reviews.col.product'),
      mobile: 'meta',
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Thumb src={images.get(r.productId)} alt={r.productName} size="xs" className="max-md:hidden" />
          <Link to={`/products/${r.productId}`} className="line-clamp-2 max-w-48 text-ink hover:text-rose-dark hover:underline">
            {r.productName}
          </Link>
        </div>
      ),
    },
    { id: 'rating', header: t('customers.reviews.col.rating'), sortKey: 'rating', mobile: 'end', cell: (r) => <RatingStars rating={r.rating} /> },
    {
      id: 'review',
      header: t('customers.reviews.col.review'),
      mobile: 'title',
      hideable: false,
      width: '34%',
      cell: (r) => (
        <div className="min-w-0 max-w-md">
          <p className="truncate font-semibold text-ink">{r.title}</p>
          <p className="line-clamp-2 text-[12.5px] leading-relaxed font-normal text-muted">{r.body}</p>
        </div>
      ),
    },
    { id: 'date', header: t('customers.reviews.col.date'), sortKey: 'createdAt', mobile: 'meta', cell: (r) => <span className="whitespace-nowrap text-muted">{formatDate(r.createdAt, lang)}</span> },
    { id: 'status', header: t('customers.reviews.col.status'), mobile: 'end', cell: (r) => <StatusBadge status={r.status} /> },
    { id: 'actions', header: <span className="sr-only">{t('common.actions')}</span>, align: 'end', hideable: false, cell: (r) => <ReviewRowActions review={r} mod={mod} /> },
  ]

  return (
    <>
      <PageHeader
        title={t('customers.reviews.title')}
        description={t('customers.reviews.description')}
        breadcrumbs={[{ label: t('nav.reviews') }]}
        actions={
          <Button variant="outline" icon={<Download className="size-4" />} onClick={exportCsv} loading={exporting}>
            {t('common.exportCsv')}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t('customers.reviews.stats.total')}
          value={s ? formatNumber(s.total) : '—'}
          icon={<MessageSquareText />}
          loading={!s}
          period={
            s ? (
              <span className="inline-flex items-center gap-1">
                <Star className="size-3 fill-champagne text-champagne" aria-hidden />
                {t('customers.reviews.stats.average', { value: s.average.toFixed(1) })}
              </span>
            ) : undefined
          }
        />
        <StatCard label={t('customers.reviews.stats.pending')} value={s ? formatNumber(s.pending) : '—'} icon={<Clock />} tone="warning" loading={!s} period={t('customers.reviews.stats.awaiting')} href="/reviews?status=pending" />
        <StatCard label={t('customers.reviews.stats.approved')} value={s ? formatNumber(s.approved) : '—'} icon={<CheckCircle2 />} tone="success" loading={!s} href="/reviews?status=approved" />
        <StatCard label={t('customers.reviews.stats.rejected')} value={s ? formatNumber(s.rejected) : '—'} icon={<XCircle />} tone="error" loading={!s} href="/reviews?status=rejected" />
      </div>

      <Tabs
        className="mb-4"
        value={status}
        onChange={(v) => {
          setSelected(new Set())
          list.setFilter('status', v === 'all' ? undefined : v)
        }}
        tabs={TABS.map((tab) => ({ value: tab, label: t(`customers.reviews.tabs.${tab}`), count: tabCount(tab) }))}
      />

      <DataTable
        tableId="reviews"
        className="[&_li:has([data-pending])]:bg-warning-soft/35 [&_tr:has([data-pending])]:bg-warning-soft/35"
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
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        bulkActions={(ids) => (
          <>
            <Button size="sm" variant="outline" icon={<CheckCircle2 className="size-4 text-success" />} loading={bulkBusy} onClick={() => bulk(ids, 'approved')}>
              {t('customers.reviews.actions.approveSelected')}
            </Button>
            <Button size="sm" variant="outline" icon={<XCircle className="size-4 text-error" />} disabled={bulkBusy} onClick={() => setBulkReject(ids)}>
              {t('customers.reviews.actions.rejectSelected')}
            </Button>
          </>
        )}
        onRowClick={(r) => navigate(`/reviews/${r.id}`)}
        empty={<EmptyState icon={<MessageSquareText />} title={t('customers.reviews.emptyTitle')} description={t('customers.reviews.emptyDesc')} />}
        toolbar={
          <>
            <SearchInput value={searchInput} onChange={setSearchInput} placeholder={t('customers.reviews.searchPlaceholder')} className="w-full min-w-0 flex-1 sm:max-w-xs" />
            <ResponsiveFilters activeCount={rating ? 1 : 0} onClear={() => list.clearFilters(['rating'])}>
              <FilterSelect
                label={t('customers.reviews.filters.rating')}
                value={rating ? String(rating) : ''}
                onChange={(v) => list.setFilter('rating', v || undefined)}
                allLabel={t('customers.reviews.filters.allRatings')}
                options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: n === 1 ? t('customers.reviews.filters.star') : t('customers.reviews.filters.stars', { count: n }) }))}
                className="md:w-40"
              />
            </ResponsiveFilters>
            {status === 'pending' && s && s.pending > 0 && <Badge tone="warning">{t('customers.reviews.stats.awaiting')}</Badge>}
          </>
        }
      />

      <ConfirmDialog
        open={!!bulkReject}
        onClose={() => setBulkReject(null)}
        title={t('customers.reviews.confirm.bulkRejectTitle', { count: bulkReject?.length ?? 0 })}
        description={t('customers.reviews.confirm.bulkRejectDesc')}
        confirmLabel={t('customers.reviews.actions.rejectSelected')}
        onConfirm={async () => {
          if (bulkReject) await bulk(bulkReject, 'rejected')
        }}
      />
      {mod.dialogs}
    </>
  )
}
