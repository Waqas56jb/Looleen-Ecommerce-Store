import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertTriangle, Archive, Copy, Download, Eye, MoreHorizontal, Package, PackageX, Pencil, Plus, RotateCcw, ShieldCheck, Star, StarOff, Trash2 } from 'lucide-react'
import { productCsvRows, parseProductFilters, PRODUCT_FILTER_KEYS } from '@/components/products/productUtils'
import { ProductFilters } from '@/components/products/ProductFilters'
import { useProductActions } from '@/components/products/useProductActions'
import { Button, ButtonLink, ConfirmDialog, DataTable, Dropdown, EmptyState, IconButton, PageHeader, PriceDisplay, RatingStars, StatCard, StatusBadge, Thumb, Tooltip, type Column } from '@/components/ui'
import { useAsync, useDocumentTitle, useListState } from '@/hooks'
import { useT } from '@/i18n'
import { getAllBrands, getCategories } from '@/services/catalogService'
import { bulkUpdateProducts, getProducts, getProductStats, type BulkProductAction, type ProductRow } from '@/services/productService'
import { cn, downloadCsv, formatDate, formatNumber } from '@/utils'

type BulkKind = Extract<BulkProductAction, 'delete' | 'archive' | 'feature' | 'unfeature'>

export default function ProductsPage() {
  const { t, lang } = useT()
  useDocumentTitle(t('products.title'))
  const navigate = useNavigate()
  const list = useListState({ sortBy: 'updatedAt', sortDir: 'desc' })
  const filterKey = PRODUCT_FILTER_KEYS.map((k) => list.filter(k)).join('|')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filters = useMemo(() => parseProductFilters(list.filter), [filterKey])

  const { data, loading, error, reload } = useAsync(() => getProducts({ ...list.query, filters }), [list.query, filters])
  const stats = useAsync(() => getProductStats(), [])
  const brands = useAsync(() => getAllBrands(), [])
  const cats = useAsync(() => getCategories(), [])
  const catName = useMemo(() => new Map((cats.data ?? []).map((c) => [c.id, c.name[lang] || c.name.en])), [cats.data, lang])

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulk, setBulk] = useState<{ kind: BulkKind; ids: string[]; clear: () => void } | null>(null)
  const [exporting, setExporting] = useState(false)

  const refresh = () => {
    reload()
    stats.reload()
  }
  const actions = useProductActions({ onChanged: refresh })

  const hasFilters = !!list.search || PRODUCT_FILTER_KEYS.some((k) => list.filter(k))

  const exportCsv = async (ids?: string[]) => {
    setExporting(true)
    try {
      const res = await getProducts({ search: list.search, sortBy: list.sortBy, sortDir: list.sortDir, filters, page: 1, pageSize: 10000 })
      const rows = ids ? res.items.filter((p) => ids.includes(p.id)) : res.items
      if (!rows.length) return
      downloadCsv('products', productCsvRows(rows))
      toast.success(t('common.exported', { count: rows.length }))
    } finally {
      setExporting(false)
    }
  }

  const runBulk = async () => {
    if (!bulk) return
    try {
      const n = await bulkUpdateProducts(bulk.ids, bulk.kind)
      const key = { delete: 'bulkDeleted', archive: 'bulkArchived', feature: 'bulkFeatured', unfeature: 'bulkUnfeatured' }[bulk.kind]
      toast.success(t(`products.toast.${key}`, { count: n }))
      bulk.clear()
      refresh()
    } catch {
      toast.error(t('products.toast.failed'))
    }
  }

  const bulkCopy = bulk && {
    delete: { title: 'bulkDeleteTitle', desc: 'bulkDeleteDesc', label: t('products.actions.delete') },
    archive: { title: 'bulkArchiveTitle', desc: 'bulkArchiveDesc', label: t('products.actions.archive') },
    feature: { title: 'bulkFeatureTitle', desc: 'bulkFeatureDesc', label: t('products.actions.markFeatured') },
    unfeature: { title: 'bulkUnfeatureTitle', desc: 'bulkUnfeatureDesc', label: t('products.actions.removeFeatured') },
  }[bulk.kind]

  const columns: Column<ProductRow>[] = [
    { id: 'image', header: t('products.col.image'), cell: (p) => <Thumb src={p.images[0]} alt={p.name} size="sm" />, mobile: 'hidden', hideable: false, width: '64px' },
    {
      id: 'product',
      header: t('products.col.product'),
      sortKey: 'name',
      mobile: 'title',
      cell: (p) => (
        <div className="flex min-w-0 items-center gap-3">
          <Thumb src={p.images[0]} alt="" size="sm" className="md:hidden" />
          <div className="min-w-0">
            <p className="max-w-[18rem] truncate font-medium text-ink">{lang === 'ar' && p.nameAr ? p.nameAr : p.name}</p>
            <p className="text-xs text-muted" dir="ltr">
              <span className="font-mono">{p.sku}</span>
            </p>
          </div>
        </div>
      ),
    },
    { id: 'brand', header: t('products.col.brand'), sortKey: 'brand', mobile: 'subtitle', cell: (p) => <span className="whitespace-nowrap">{p.brandName}</span> },
    {
      id: 'category',
      header: t('products.col.category'),
      sortKey: 'category',
      mobile: 'meta',
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate">{catName.get(p.categoryId) ?? p.categoryName}</p>
          <p className="truncate text-xs text-muted">{catName.get(p.subcategoryId) ?? p.subcategoryName}</p>
        </div>
      ),
    },
    { id: 'price', header: t('products.col.price'), sortKey: 'price', align: 'end', mobile: 'end', cell: (p) => <PriceDisplay price={p.price} compareAt={p.compareAtPrice} className="justify-end" /> },
    {
      id: 'stock',
      header: t('products.col.stock'),
      sortKey: 'stock',
      align: 'end',
      mobile: 'meta',
      cell: (p) => (
        <span className={cn('font-medium tabular-nums', p.stock <= 0 ? 'text-error' : p.stock <= p.lowStockThreshold ? 'text-warning' : 'text-ink')}>
          {formatNumber(p.stock)}
        </span>
      ),
    },
    {
      id: 'rating',
      header: t('products.col.rating'),
      sortKey: 'rating',
      mobile: 'meta',
      cell: (p) =>
        p.reviewCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <RatingStars rating={p.rating} size={12} showValue />
            <span className="text-xs text-subtle tabular-nums">({p.reviewCount})</span>
          </span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    { id: 'status', header: t('products.col.status'), mobile: 'end', cell: (p) => <StatusBadge status={p.derivedStatus} /> },
    {
      id: 'original',
      header: t('products.col.original'),
      align: 'center',
      mobile: 'hidden',
      cell: (p) =>
        p.flags.original ? (
          <Tooltip content={t('common.original')}>
            <span className="inline-grid size-7 place-items-center rounded-full bg-success-soft text-success">
              <ShieldCheck className="size-4" aria-label={t('common.original')} />
            </span>
          </Tooltip>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      id: 'featured',
      header: t('products.col.featured'),
      align: 'center',
      mobile: 'hidden',
      cell: (p) => (
        <IconButton
          label={p.flags.featured ? t('products.actions.removeFeatured') : t('products.actions.markFeatured')}
          size="sm"
          aria-pressed={p.flags.featured}
          disabled={actions.busyId === p.id}
          onClick={() => actions.toggleFeatured(p)}
          className={p.flags.featured ? 'text-champagne hover:text-champagne' : 'text-line hover:text-champagne'}
        >
          <Star fill={p.flags.featured ? 'currentColor' : 'none'} />
        </IconButton>
      ),
    },
    { id: 'updated', header: t('products.col.updated'), sortKey: 'updatedAt', mobile: 'meta', cell: (p) => <span className="whitespace-nowrap text-muted">{formatDate(p.updatedAt, lang)}</span> },
    {
      id: 'actions',
      header: <span className="sr-only">{t('common.actions')}</span>,
      align: 'end',
      hideable: false,
      width: '56px',
      cell: (p) => (
        <Dropdown
          trigger={({ toggle }) => (
            <IconButton label={t('products.actions.more')} size="sm" onClick={toggle}>
              <MoreHorizontal />
            </IconButton>
          )}
          items={[
            { label: t('products.actions.view'), icon: <Eye />, onClick: () => navigate(`/products/${p.id}`) },
            { label: t('products.actions.edit'), icon: <Pencil />, onClick: () => navigate(`/products/${p.id}/edit`) },
            { label: t('products.actions.duplicate'), icon: <Copy />, onClick: () => actions.duplicate(p), disabled: actions.busyId === p.id },
            { label: p.flags.featured ? t('products.actions.removeFeatured') : t('products.actions.markFeatured'), icon: p.flags.featured ? <StarOff /> : <Star />, onClick: () => actions.toggleFeatured(p) },
            { divider: true, label: '' },
            p.status === 'archived'
              ? { label: t('products.actions.activate'), icon: <RotateCcw />, onClick: () => actions.confirmActivate(p) }
              : { label: t('products.actions.archive'), icon: <Archive />, onClick: () => actions.confirmArchive(p) },
            { label: t('products.actions.delete'), icon: <Trash2 />, danger: true, onClick: () => actions.confirmDelete(p) },
          ]}
        />
      ),
    },
  ]

  const st = stats.data
  const stockFilter = list.filter('stock')

  return (
    <>
      <PageHeader
        title={t('products.title')}
        description={t('products.description')}
        breadcrumbs={[{ label: t('nav.catalog') }, { label: t('products.title') }]}
        actions={
          <>
            <Button variant="outline" icon={<Download className="size-4" />} loading={exporting} onClick={() => exportCsv()}>
              {t('common.exportCsv')}
            </Button>
            <ButtonLink to="/products/new" icon={<Plus className="size-4" />}>
              {t('products.add')}
            </ButtonLink>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <button type="button" className="text-start" onClick={() => list.clearFilters(PRODUCT_FILTER_KEYS)}>
          <StatCard label={t('products.stats.total')} value={formatNumber(st?.total ?? 0)} icon={<Package />} loading={stats.loading && !st} period={st ? t('products.stats.drafts', { count: st.draft, archived: st.archived }) : undefined} />
        </button>
        <button type="button" className={cn('rounded-lg text-start', list.filter('status') === 'active' && 'ring-2 ring-ink/15')} onClick={() => list.setFilter('status', list.filter('status') === 'active' ? undefined : 'active')} title={t('products.stats.clickToFilter')}>
          <StatCard label={t('products.stats.active')} value={formatNumber(st?.active ?? 0)} icon={<ShieldCheck />} tone="success" loading={stats.loading && !st} />
        </button>
        <button type="button" className={cn('rounded-lg text-start', stockFilter === 'out' && 'ring-2 ring-error/25')} onClick={() => list.setFilter('stock', stockFilter === 'out' ? undefined : 'out')} title={t('products.stats.clickToFilter')}>
          <StatCard label={t('products.stats.outOfStock')} value={formatNumber(st?.outOfStock ?? 0)} icon={<PackageX />} tone="error" loading={stats.loading && !st} />
        </button>
        <button type="button" className={cn('rounded-lg text-start', stockFilter === 'low' && 'ring-2 ring-warning/25')} onClick={() => list.setFilter('stock', stockFilter === 'low' ? undefined : 'low')} title={t('products.stats.clickToFilter')}>
          <StatCard label={t('products.stats.lowStock')} value={formatNumber(st?.lowStock ?? 0)} icon={<AlertTriangle />} tone="warning" loading={stats.loading && !st} />
        </button>
      </div>

      <DataTable
        tableId="products"
        columns={columns}
        rows={data?.items}
        rowKey={(p) => p.id}
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
        onRowClick={(p) => navigate(`/products/${p.id}`)}
        toolbar={<ProductFilters list={list} brands={brands.data ?? []} categories={cats.data ?? []} />}
        bulkActions={(ids, clear) => (
          <>
            <Button size="sm" variant="outline" icon={<Star className="size-4" />} onClick={() => setBulk({ kind: 'feature', ids, clear })}>
              {t('products.actions.markFeatured')}
            </Button>
            <Button size="sm" variant="outline" icon={<StarOff className="size-4" />} onClick={() => setBulk({ kind: 'unfeature', ids, clear })}>
              {t('products.actions.removeFeatured')}
            </Button>
            <Button size="sm" variant="outline" icon={<Archive className="size-4" />} onClick={() => setBulk({ kind: 'archive', ids, clear })}>
              {t('products.actions.archive')}
            </Button>
            <Button size="sm" variant="outline" icon={<Download className="size-4" />} onClick={() => exportCsv(ids)}>
              {t('products.actions.exportSelected')}
            </Button>
            <Button size="sm" variant="danger" icon={<Trash2 className="size-4" />} onClick={() => setBulk({ kind: 'delete', ids, clear })}>
              {t('products.actions.delete')}
            </Button>
          </>
        )}
        empty={
          hasFilters ? (
            <EmptyState
              title={t('products.empty.filteredTitle')}
              description={t('products.empty.filteredDesc')}
              action={{
                label: t('common.clearAll'),
                onClick: () => {
                  list.clearFilters([...PRODUCT_FILTER_KEYS, 'q'])
                },
              }}
            />
          ) : (
            <EmptyState icon={<Package />} title={t('products.empty.title')} description={t('products.empty.desc')} action={{ label: t('products.add'), to: '/products/new', icon: <Plus className="size-4" /> }} />
          )
        }
      />

      {actions.dialog}
      <ConfirmDialog
        open={!!bulk}
        onClose={() => setBulk(null)}
        onConfirm={runBulk}
        tone={bulk?.kind === 'feature' || bulk?.kind === 'unfeature' ? 'default' : 'danger'}
        title={bulkCopy ? t(`products.confirm.${bulkCopy.title}`, { count: bulk!.ids.length }) : ''}
        description={bulkCopy ? t(`products.confirm.${bulkCopy.desc}`, { count: bulk!.ids.length }) : undefined}
        confirmLabel={bulkCopy?.label}
      />
    </>
  )
}
