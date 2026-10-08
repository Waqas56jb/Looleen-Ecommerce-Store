import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Download, Receipt, ShoppingBag, UserCheck, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, Button, DataTable, EmptyState, Money, PageHeader, SearchInput, StatCard, StatusBadge, type Column } from '@/components/ui'
import { CustomerRowMenu, useCustomerActions } from '@/components/customers/CustomerActions'
import { FilterSelect, MultiSelectFilter, ResponsiveFilters, useDebouncedSearch } from '@/components/customers/ListFilters'
import { SalonTypeChart } from '@/components/customers/SalonTypeChart'
import { SALON_TYPES, cityOptions, customerCsvRow } from '@/components/customers/shared'
import { useAsync, useDocumentTitle, useListState } from '@/hooks'
import { useT } from '@/i18n'
import { getCustomers, getProfessionalStats } from '@/services/customerService'
import type { AdminCustomer, SalonType } from '@/types'
import { cityName, downloadCsv, formatNumber } from '@/utils'

export default function ProfessionalCustomersPage() {
  const { t, lang } = useT()
  useDocumentTitle(t('customers.professional.title'))
  const navigate = useNavigate()
  const list = useListState({ sortBy: 'totalSpent', sortDir: 'desc' })
  const [searchInput, setSearchInput] = useDebouncedSearch(list.search, list.setSearch)
  const salonType = list.filter('salonType') as SalonType | ''
  const cities = list.filterList('city')

  const filters = useMemo(
    () => ({ customerType: 'professional' as const, businessType: SALON_TYPES.includes(salonType as SalonType) ? (salonType as SalonType) : undefined, city: cities.length ? cities : undefined }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [salonType, cities.join(',')],
  )

  const stats = useAsync(() => getProfessionalStats(), [])
  const { data, loading, error, reload } = useAsync(() => getCustomers({ ...list.query, filters }), [list.query, filters])
  const refresh = () => {
    reload()
    stats.reload()
  }
  const actions = useCustomerActions(refresh)
  const [exporting, setExporting] = useState(false)
  const s = stats.data
  const activeFilterCount = (salonType ? 1 : 0) + (cities.length ? 1 : 0)

  const exportCsv = async () => {
    setExporting(true)
    try {
      const all = await getCustomers({ ...list.query, page: 1, pageSize: 10000, filters })
      if (!all.items.length) return
      downloadCsv('professional-customers', all.items.map((c) => customerCsvRow(c, lang)))
      toast.success(t('common.exported', { count: all.items.length }))
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<AdminCustomer>[] = [
    {
      id: 'business',
      header: t('customers.professional.col.business'),
      sortKey: 'businessName',
      mobile: 'title',
      hideable: false,
      cell: (c) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={c.businessName ?? c.name} size="sm" className="rounded-md bg-champagne-soft text-[#7a5a26]" />
          <span className="truncate font-medium text-ink">{c.businessName ?? c.name}</span>
        </div>
      ),
    },
    { id: 'contact', header: t('customers.professional.col.contact'), sortKey: 'contactPerson', mobile: 'subtitle', cell: (c) => c.contactPerson ?? c.name },
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
    {
      id: 'email',
      header: t('customers.col.email'),
      mobile: 'hidden',
      cell: (c) => (
        <span dir="ltr" className="text-muted">
          {c.email}
        </span>
      ),
    },
    { id: 'city', header: t('customers.col.city'), mobile: 'meta', cell: (c) => cityName(c.city, lang) },
    { id: 'salonType', header: t('customers.professional.col.salonType'), mobile: 'meta', cell: (c) => (c.businessType ? t(`salonTypes.${c.businessType}`) : '—') },
    { id: 'orders', header: t('customers.col.orders'), sortKey: 'ordersCount', align: 'end', mobile: 'meta', cell: (c) => <span className="tabular-nums">{formatNumber(c.ordersCount)}</span> },
    { id: 'spent', header: t('customers.professional.col.totalSpent'), sortKey: 'totalSpent', align: 'end', mobile: 'end', cell: (c) => <Money value={c.totalSpent} className="font-medium" /> },
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
        title={t('customers.professional.title')}
        description={t('customers.professional.description')}
        breadcrumbs={[{ label: t('nav.customers'), to: '/customers' }, { label: t('customers.professional.title') }]}
        actions={
          <Button variant="outline" icon={<Download className="size-4" />} onClick={exportCsv} loading={exporting}>
            {t('common.exportCsv')}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="grid grid-cols-2 gap-4 xl:col-span-2">
          <StatCard label={t('customers.professional.stats.accounts')} value={s ? formatNumber(s.count) : '—'} icon={<Briefcase />} loading={!s} />
          <StatCard label={t('customers.professional.stats.active')} value={s ? formatNumber(s.active) : '—'} icon={<UserCheck />} tone="success" loading={!s} />
          <StatCard label={t('customers.professional.stats.revenue')} value={s ? <Money value={s.revenue} compact /> : '—'} icon={<Wallet />} loading={!s} />
          <StatCard label={t('customers.professional.stats.orders')} value={s ? formatNumber(s.orders) : '—'} icon={<ShoppingBag />} loading={!s} />
          <div className="col-span-2">
            <StatCard label={t('customers.professional.stats.averageOrder')} value={s ? <Money value={s.averageOrder} /> : '—'} icon={<Receipt />} loading={!s} />
          </div>
        </div>
        <SalonTypeChart byType={s?.byType} loading={!s} />
      </div>

      <DataTable
        tableId="professional-customers"
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
        empty={<EmptyState icon={<Briefcase />} title={t('customers.professional.emptyTitle')} description={t('customers.professional.emptyDesc')} />}
        toolbar={
          <>
            <SearchInput value={searchInput} onChange={setSearchInput} placeholder={t('customers.professional.searchPlaceholder')} className="w-full min-w-0 flex-1 sm:max-w-xs" />
            <ResponsiveFilters activeCount={activeFilterCount} onClear={() => list.clearFilters(['salonType', 'city'])}>
              <FilterSelect
                label={t('customers.filters.salonType')}
                value={salonType}
                onChange={(v) => list.setFilter('salonType', v || undefined)}
                allLabel={t('customers.filters.allSalonTypes')}
                options={SALON_TYPES.map((v) => ({ value: v, label: t(`salonTypes.${v}`) }))}
                className="md:w-48"
              />
              <MultiSelectFilter
                label={t('customers.filters.city')}
                value={cities}
                onChange={(v) => list.setFilter('city', v.length ? v : undefined)}
                options={cityOptions(lang)}
                allLabel={t('customers.filters.allCities')}
                countLabel={(count) => t('customers.filters.citiesSelected', { count })}
              />
            </ResponsiveFilters>
          </>
        }
      />
      {actions.dialogs}
    </>
  )
}
