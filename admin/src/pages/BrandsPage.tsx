import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { BadgeCheck, Download, Eye, MoreHorizontal, Package, Pencil, Plus, Power, Star, StarOff, Tags, Trash2 } from 'lucide-react'
import { BRAND_FILTER_KEYS, BrandFilters, parseBrandFilters } from '@/components/brands/BrandFilters'
import { AuthorizedBadge, BrandLogo, useCountryName } from '@/components/brands/shared'
import { useBrandActions } from '@/components/brands/useBrandActions'
import { Button, ButtonLink, DataTable, Dropdown, EmptyState, IconButton, Money, PageHeader, SearchInput, StatCard, StatusBadge, type Column } from '@/components/ui'
import { useAsync, useDocumentTitle, useListState } from '@/hooks'
import { useT } from '@/i18n'
import { getBrands, getBrandStats, type BrandRow } from '@/services/catalogService'
import { cn, downloadCsv, formatDate, formatNumber } from '@/utils'

export default function BrandsPage() {
  const { t, lang } = useT()
  useDocumentTitle(t('catalog.brands.title'))
  const navigate = useNavigate()
  const countryName = useCountryName()
  const list = useListState({ sortBy: 'name', sortDir: 'asc' })
  const filterKey = BRAND_FILTER_KEYS.map((k) => list.filter(k)).join('|')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filters = useMemo(() => parseBrandFilters(list.filter), [filterKey])
  const { data, loading, error, reload } = useAsync(() => getBrands({ ...list.query, filters }), [list.query, filters])
  const stats = useAsync(() => getBrandStats(), [])
  const [exporting, setExporting] = useState(false)

  const refresh = () => {
    reload()
    stats.reload()
  }
  const actions = useBrandActions({ onChanged: refresh })

  const exportCsv = async () => {
    setExporting(true)
    try {
      const res = await getBrands({ search: list.search, sortBy: list.sortBy, sortDir: list.sortDir, filters, page: 1, pageSize: 10000 })
      if (!res.items.length) return
      downloadCsv(
        'brands',
        res.items.map((b) => ({
          ID: b.id,
          Name: b.name,
          'Arabic Name': b.nameAr,
          Slug: b.slug,
          Country: b.country,
          Website: b.website,
          Distributor: b.distributor,
          Authorized: b.authorized ? 'Yes' : 'No',
          Featured: b.featured ? 'Yes' : 'No',
          Status: b.status,
          Products: b.productCount,
          'Units Sold': b.unitsSold,
          'Revenue (SAR)': Math.round(b.revenue),
          Created: b.createdAt.slice(0, 10),
        })),
      )
      toast.success(t('common.exported', { count: res.items.length }))
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<BrandRow>[] = [
    { id: 'logo', header: t('catalog.brands.colLogo'), cell: (b) => <BrandLogo name={b.name} logo={b.logo} />, hideable: false, mobile: 'hidden', width: '64px' },
    {
      id: 'brand',
      header: t('catalog.brands.colBrand'),
      sortKey: 'name',
      mobile: 'title',
      cell: (b) => (
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo name={b.name} logo={b.logo} className="md:hidden" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{b.name}</p>
            <p className="truncate text-xs text-muted">
              <span dir="rtl">{b.nameAr}</span>
              {b.country && <span className="text-subtle"> · {countryName(b.country)}</span>}
            </p>
          </div>
        </div>
      ),
    },
    { id: 'distributor', header: t('catalog.brands.colDistributor'), cell: (b) => <span className="block max-w-52 truncate text-muted" dir="ltr">{b.distributor || '—'}</span>, mobile: 'hidden' },
    { id: 'authorized', header: t('catalog.brands.colAuthorized'), cell: (b) => <AuthorizedBadge authorized={b.authorized} />, mobile: 'subtitle' },
    { id: 'products', header: t('catalog.brands.colProducts'), sortKey: 'productCount', align: 'end', cell: (b) => <span className="tabular-nums">{formatNumber(b.productCount)}</span>, mobile: 'meta' },
    { id: 'revenue', header: t('catalog.brands.colRevenue'), sortKey: 'revenue', align: 'end', cell: (b) => <Money value={b.revenue} compact />, mobile: 'end' },
    { id: 'status', header: t('catalog.brands.colStatus'), cell: (b) => <StatusBadge status={b.status} />, mobile: 'end' },
    {
      id: 'featured',
      header: t('catalog.brands.colFeatured'),
      align: 'center',
      mobile: 'meta',
      cell: (b) => (
        <IconButton size="xs" label={b.featured ? t('catalog.brands.unfeature') : t('catalog.brands.feature')} onClick={() => actions.toggleFeatured(b)} aria-pressed={b.featured}>
          <Star className={cn(b.featured ? 'fill-champagne text-champagne' : 'text-line')} />
        </IconButton>
      ),
    },
    { id: 'created', header: t('catalog.brands.colCreated'), sortKey: 'createdAt', cell: (b) => <span className="whitespace-nowrap text-muted">{formatDate(b.createdAt, lang)}</span>, mobile: 'meta', defaultHidden: false },
    {
      id: 'actions',
      header: <span className="sr-only">{t('common.actions')}</span>,
      align: 'end',
      hideable: false,
      cell: (b) => (
        <Dropdown
          trigger={({ toggle, open }) => (
            <IconButton size="sm" label={t('catalog.brands.rowActions', { name: b.name })} onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
              <MoreHorizontal />
            </IconButton>
          )}
          items={[
            { label: t('common.view'), icon: <Eye />, onClick: () => navigate(`/brands/${b.id}`) },
            { label: t('common.edit'), icon: <Pencil />, onClick: () => navigate(`/brands/${b.id}/edit`) },
            { label: b.featured ? t('catalog.brands.unfeature') : t('catalog.brands.feature'), icon: b.featured ? <StarOff /> : <Star />, onClick: () => actions.toggleFeatured(b) },
            { label: b.status === 'active' ? t('catalog.brands.deactivate') : t('catalog.brands.activate'), icon: <Power />, onClick: () => actions.toggleStatus(b) },
            { label: '', divider: true },
            { label: t('common.delete'), icon: <Trash2 />, danger: true, onClick: () => actions.requestDelete(b) },
          ]}
        />
      ),
    },
  ]

  const s = stats.data
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('catalog.brands.title')}
        description={t('catalog.brands.description')}
        breadcrumbs={[{ label: t('nav.brands') }]}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} loading={exporting} icon={<Download className="size-4" />}>
              {t('common.exportCsv')}
            </Button>
            <ButtonLink to="/brands/new" icon={<Plus className="size-4" />}>
              {t('catalog.brands.add')}
            </ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t('catalog.brands.statTotal')} value={formatNumber(s?.total ?? 0)} icon={<Tags />} loading={!s} period={s ? t('catalog.brands.authorizedMeta', { count: s.authorized }) : undefined} />
        <StatCard label={t('catalog.brands.statActive')} value={formatNumber(s?.active ?? 0)} icon={<BadgeCheck />} tone="success" loading={!s} />
        <StatCard label={t('catalog.brands.statWithProducts')} value={formatNumber(s?.withProducts ?? 0)} icon={<Package />} loading={!s} />
        <StatCard label={t('catalog.brands.statFeatured')} value={formatNumber(s?.featured ?? 0)} icon={<Star />} loading={!s} />
      </div>

      <DataTable
        className="mt-6"
        tableId="brands"
        columns={columns}
        rows={data?.items}
        rowKey={(b) => b.id}
        loading={loading}
        error={error}
        onRetry={reload}
        total={data?.total}
        page={list.page}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        sortBy={list.sortBy}
        sortDir={list.sortDir}
        onSort={list.setSort}
        onRowClick={(b) => navigate(`/brands/${b.id}`)}
        toolbar={
          <>
            <SearchInput value={list.search} onChange={list.setSearch} placeholder={t('catalog.brands.searchPlaceholder')} className="w-full sm:w-72" />
            <BrandFilters value={list.filter} onChange={list.setFilter} onClear={() => list.clearFilters([...BRAND_FILTER_KEYS])} />
          </>
        }
        empty={<EmptyState icon={<Tags />} title={t('catalog.brands.emptyTitle')} description={t('catalog.brands.emptyDesc')} action={{ label: t('catalog.brands.add'), to: '/brands/new' }} />}
      />
      {actions.dialog}
    </div>
  )
}
