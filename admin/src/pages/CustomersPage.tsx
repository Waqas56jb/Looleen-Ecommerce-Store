import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Crown, Download, UserCheck, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, Button, DataTable, EmptyState, Money, PageHeader, SearchInput, StatCard, StatusBadge, Tabs, type Column } from '@/components/ui'
import { CustomerRowMenu, useCustomerActions } from '@/components/customers/CustomerActions'
import { FilterSelect, MultiSelectFilter, ResponsiveFilters, useDebouncedSearch } from '@/components/customers/ListFilters'
import { CUSTOMER_TYPES, CustomerTypeBadge, cityOptions, customerCsvRow } from '@/components/customers/shared'
import { useAsync, useDocumentTitle, useListState } from '@/hooks'
import { useT } from '@/i18n'
import { getCustomerStats, getCustomers, type CustomerSegmentKey } from '@/services/customerService'
import type { AdminCustomer, CustomerType } from '@/types'
import { cityName, downloadCsv, formatNumber, timeAgo } from '@/utils'

const SEGMENTS: CustomerSegmentKey[] = ['all', 'new', 'vip', 'high_spenders', 'inactive', 'professional', 'salon']
const SEGMENT_STAT: Record<CustomerSegmentKey, 'total' | 'newThisMonth' | 'vip' | 'highSpenders' | 'inactive' | 'professional' | 'salon'> = {
  all: 'total',
  new: 'newThisMonth',
  vip: 'vip',
  high_spenders: 'highSpenders',
  inactive: 'inactive',
  professional: 'professional',
  salon: 'salon',
}

export default function CustomersPage() {
  const { t, lang } = useT()
  useDocumentTitle(t('customers.title'))
  const navigate = useNavigate()
  const list = useListState({ sortBy: 'registeredAt', sortDir: 'desc' })
  const [searchInput, setSearchInput] = useDebouncedSearch(list.search, list.setSearch)

  const segmentParam = list.filter('segment') as CustomerSegmentKey
  const segment: CustomerSegmentKey = SEGMENTS.includes(segmentParam) ? segmentParam : 'all'
  const cities = list.filterList('city')
  const type = list.filter('type') as CustomerType | ''
  const status = list.filter('status') as 'active' | 'inactive' | ''

  const filters = useMemo(
    () => ({ segment, city: cities.length ? cities : undefined, customerType: type || undefined, status: status || undefined }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [segment, cities.join(','), type, status],
  )

  const stats = useAsync(() => getCustomerStats(), [])
  const { data, loading, error, reload } = useAsync(() => getCustomers({ ...list.query, filters }), [list.query, filters])
  const refresh = () => {
    reload()
    stats.reload()
  }
  const actions = useCustomerActions(refresh)
  const [exporting, setExporting] = useState(false)

  const exportCsv = async () => {
    setExporting(true)
    try {
      const all = await getCustomers({ ...list.query, page: 1, pageSize: 10000, filters })
      if (!all.items.length) return
      downloadCsv(`customers-${segment}`, all.items.map((c) => customerCsvRow(c, lang)))
      toast.success(t('common.exported', { count: all.items.length }))
    } finally {
      setExporting(false)
    }
  }

  const activeFilterCount = (cities.length ? 1 : 0) + (type ? 1 : 0) + (status ? 1 : 0)
  const s = stats.data

  const columns: Column<AdminCustomer>[] = [
    {
      id: 'customer',
      header: t('customers.col.customer'),
      sortKey: 'name',
      mobile: 'title',
      hideable: false,
      cell: (c) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={c.name} size="sm" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate font-medium text-ink">{c.name}</span>
              <CustomerTypeBadge type={c.customerType} />
            </div>
            {c.customerType === 'professional' && c.businessName && <p className="truncate text-xs text-muted">{c.businessName}</p>}
          </div>
        </div>
      ),
    },
    {
      id: 'email',
      header: t('customers.col.email'),
      mobile: 'subtitle',
      cell: (c) => (
        <span dir="ltr" className="text-muted">
          {c.email}
        </span>
      ),
    },
    {
      id: 'phone',
      header: t('customers.col.phone'),
      mobile: 'meta',
      cell: (c) => (
        <span dir="ltr" className="whitespace-nowrap tabular-nums">
          {c.phone}
        </span>
      ),
    },
    { id: 'city', header: t('customers.col.city'), mobile: 'meta', cell: (c) => cityName(c.city, lang) },
    { id: 'orders', header: t('customers.col.orders'), sortKey: 'ordersCount', align: 'end', mobile: 'meta', cell: (c) => <span className="tabular-nums">{formatNumber(c.ordersCount)}</span> },
    { id: 'spent', header: t('customers.col.spent'), sortKey: 'totalSpent', align: 'end', mobile: 'end', cell: (c) => <Money value={c.totalSpent} className="font-medium" /> },
    {
      id: 'lastOrder',
      header: t('customers.col.lastOrder'),
      sortKey: 'lastOrderAt',
      mobile: 'meta',
      cell: (c) => <span className="whitespace-nowrap text-muted">{c.lastOrderAt ? timeAgo(c.lastOrderAt, lang) : t('customers.noOrdersYet')}</span>,
    },
    {
      id: 'registered',
      header: t('customers.col.registered'),
      sortKey: 'registeredAt',
      mobile: 'hidden',
      defaultHidden: true,
      cell: (c) => <span className="whitespace-nowrap text-muted">{timeAgo(c.registeredAt, lang)}</span>,
    },
    { id: 'status', header: t('customers.col.status'), mobile: 'end', cell: (c) => <StatusBadge status={c.status} /> },
    {
      id: 'actions',
      header: <span className="sr-only">{t('common.actions')}</span>,
      align: 'end',
      hideable: false,
      cell: (c) => <CustomerRowMenu customer={c} onEdit={() => actions.edit(c)} onToggle={() => actions.toggleStatus(c)} />,
    },
  ]

  return (
    <>
      <PageHeader
        title={t('customers.title')}
        description={t('customers.description')}
        breadcrumbs={[{ label: t('nav.customers') }]}
        actions={
          <Button variant="outline" icon={<Download className="size-4" />} onClick={exportCsv} loading={exporting}>
            {t('common.exportCsv')}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label={t('customers.stats.total')} value={s ? formatNumber(s.total) : '—'} icon={<Users />} loading={stats.loading && !s} period={s ? <span className="inline-flex items-center gap-1">{t('customers.stats.averageSpend')} <Money value={s.averageSpend} /></span> : undefined} />
        <StatCard label={t('customers.stats.newThisMonth')} value={s ? formatNumber(s.newThisMonth) : '—'} icon={<UserPlus />} loading={stats.loading && !s} href="/customers?segment=new" />
        <StatCard label={t('customers.stats.active')} value={s ? formatNumber(s.active) : '—'} icon={<UserCheck />} tone="success" loading={stats.loading && !s} />
        <StatCard label={t('customers.stats.vip')} value={s ? formatNumber(s.vip) : '—'} icon={<Crown />} loading={stats.loading && !s} href="/customers?segment=vip" />
        <div className="col-span-2 lg:col-span-1">
          <StatCard label={t('customers.stats.professional')} value={s ? formatNumber(s.professional) : '—'} icon={<Briefcase />} loading={stats.loading && !s} href="/customers/professional" />
        </div>
      </div>

      <Tabs
        className="mb-4"
        value={segment}
        onChange={(v) => list.setFilter('segment', v === 'all' ? undefined : v)}
        tabs={SEGMENTS.map((seg) => ({ value: seg, label: t(`customers.segments.${seg}`), count: s ? s[SEGMENT_STAT[seg]] : undefined }))}
      />

      <DataTable
        tableId="customers"
        columns={columns}
        rows={data?.items}
        rowKey={(c) => c.id}
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
        onRowClick={(c) => navigate(`/customers/${c.id}`)}
        empty={<EmptyState icon={<Users />} title={t('customers.emptyTitle')} description={t('customers.emptyDesc')} action={activeFilterCount || list.search ? { label: t('customers.filters.clear'), onClick: () => { setSearchInput(''); list.clearFilters(['city', 'type', 'status', 'q']) } } : undefined} />}
        toolbar={
          <>
            <SearchInput value={searchInput} onChange={setSearchInput} placeholder={t('customers.searchPlaceholder')} className="w-full min-w-0 flex-1 sm:max-w-xs" />
            <ResponsiveFilters activeCount={activeFilterCount} onClear={() => list.clearFilters(['city', 'type', 'status'])}>
              <MultiSelectFilter
                label={t('customers.filters.city')}
                value={cities}
                onChange={(v) => list.setFilter('city', v.length ? v : undefined)}
                options={cityOptions(lang)}
                allLabel={t('customers.filters.allCities')}
                countLabel={(count) => t('customers.filters.citiesSelected', { count })}
              />
              <FilterSelect label={t('customers.filters.type')} value={type} onChange={(v) => list.setFilter('type', v || undefined)} allLabel={t('customers.filters.allTypes')} options={CUSTOMER_TYPES.map((v) => ({ value: v, label: t(`status.${v}`) }))} className="md:w-40" />
              <FilterSelect
                label={t('customers.filters.status')}
                value={status}
                onChange={(v) => list.setFilter('status', v || undefined)}
                allLabel={t('customers.filters.allStatuses')}
                options={[
                  { value: 'active', label: t('status.active') },
                  { value: 'inactive', label: t('status.inactive') },
                ]}
                className="md:w-40"
              />
            </ResponsiveFilters>
          </>
        }
      />
      {actions.dialogs}
    </>
  )
}
