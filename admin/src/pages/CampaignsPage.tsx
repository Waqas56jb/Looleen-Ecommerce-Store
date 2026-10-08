import { useMemo, useState } from 'react'
import { CalendarClock, Download, Megaphone, MoreHorizontal, Pencil, Plus, Radio, ShoppingBag, Trash2, TrendingUp, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Button, ConfirmDialog, DataTable, Dropdown, EmptyState, IconButton, Money, PageHeader, SearchInput, Segmented, Select, StatCard, StatusBadge, type Column } from '@/components/ui'
import { CampaignDrawer } from '@/components/marketing/CampaignDrawer'
import { CAMPAIGN_STATUSES, CAMPAIGN_TYPES, CampaignTypeIcon, CampaignTypeLabel, ChannelChips } from '@/components/marketing/campaignMeta'
import { CodePill, useDebouncedSearch } from '@/components/marketing/shared'
import { useAsync, useDocumentTitle, useListState } from '@/hooks'
import { useT } from '@/i18n'
import { deleteCampaign, getCampaigns, getCampaignStats } from '@/services/marketingService'
import type { Campaign, CampaignStatus } from '@/types'
import { downloadCsv, formatDate, formatNumber } from '@/utils'

export default function CampaignsPage() {
  const { t, lang } = useT()
  const C = (k: string, v?: Record<string, string | number>) => t(`marketing.campaigns.${k}`, v)
  useDocumentTitle(C('title'))
  const ls = useListState({ sortBy: 'startDate', sortDir: 'desc' })
  const [searchDraft, setSearchDraft] = useDebouncedSearch(ls.search, ls.setSearch)
  const status = (ls.filter('status') || 'all') as 'all' | CampaignStatus
  const type = ls.filter('type')
  const filters = useMemo(() => ({ status: status === 'all' ? undefined : status, type: type || undefined }), [status, type])

  const list = useAsync(() => getCampaigns({ ...ls.query, filters }), [ls.query, filters])
  const stats = useAsync(() => getCampaignStats(), [])
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Campaign | null>(null)

  const refresh = () => {
    list.reload()
    stats.reload()
  }
  const openCreate = () => {
    setEditing(null)
    setDrawerOpen(true)
  }
  const openEdit = (c: Campaign) => {
    setEditing(c)
    setDrawerOpen(true)
  }

  const exportCsv = async () => {
    const all = await getCampaigns({ ...ls.query, page: 1, pageSize: 10000, filters })
    downloadCsv(
      'campaigns',
      all.items.map((c) => ({
        Name: c.name,
        'Arabic name': c.nameAr,
        Type: t(`marketing.shared.campaignTypes.${c.type}`),
        Status: t(`status.${c.status}`),
        Start: c.startDate.slice(0, 10),
        End: c.endDate.slice(0, 10),
        'Budget (SAR)': c.budget,
        'Revenue (SAR)': c.revenue,
        Orders: c.orders,
        ROI: c.budget ? (c.revenue / c.budget).toFixed(2) : '',
        Channels: c.channels.map((ch) => t(`marketing.shared.channels.${ch}`)),
        Coupon: c.couponCode ?? '',
      })),
    )
    toast.success(t('common.exported', { count: all.items.length }))
  }

  const columns: Column<Campaign>[] = [
    {
      id: 'campaign',
      header: C('cols.campaign'),
      sortKey: 'name',
      mobile: 'title',
      hideable: false,
      cell: (c) => (
        <div className="flex min-w-48 items-center gap-3">
          <CampaignTypeIcon type={c.type} />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{lang === 'ar' ? c.nameAr : c.name}</p>
            <p className="truncate text-xs text-muted">
              <bdi>{lang === 'ar' ? c.name : c.nameAr}</bdi>
            </p>
            {c.couponCode && <CodePill code={c.couponCode} copyable={false} className="mt-1 text-[11px]" />}
          </div>
        </div>
      ),
    },
    { id: 'type', header: C('cols.type'), sortKey: 'type', mobile: 'subtitle', cell: (c) => <CampaignTypeLabel type={c.type} /> },
    { id: 'status', header: C('cols.status'), sortKey: 'status', mobile: 'end', cell: (c) => <StatusBadge status={c.status} /> },
    { id: 'start', header: C('cols.start'), sortKey: 'startDate', cell: (c) => <span className="whitespace-nowrap text-muted">{formatDate(c.startDate, lang)}</span> },
    { id: 'end', header: C('cols.end'), sortKey: 'endDate', cell: (c) => <span className="whitespace-nowrap text-muted">{formatDate(c.endDate, lang)}</span> },
    { id: 'budget', header: C('cols.budget'), sortKey: 'budget', align: 'end', cell: (c) => <Money value={c.budget} className="text-muted" /> },
    {
      id: 'revenue',
      header: C('cols.revenue'),
      sortKey: 'revenue',
      align: 'end',
      mobile: 'end',
      cell: (c) => (
        <div className="text-end">
          <Money value={c.revenue} className="font-medium" />
          {c.budget > 0 && c.revenue > 0 && (
            <p className="text-[11px] text-success tabular-nums" dir="ltr">
              {C('roiValue', { value: (c.revenue / c.budget).toFixed(1) })}
            </p>
          )}
        </div>
      ),
    },
    { id: 'orders', header: C('cols.orders'), sortKey: 'orders', align: 'end', cell: (c) => <span className="tabular-nums">{formatNumber(c.orders)}</span> },
    { id: 'channels', header: C('cols.channels'), cell: (c) => <ChannelChips channels={c.channels} max={3} /> },
    {
      id: 'actions',
      header: <span className="sr-only">{t('common.actions')}</span>,
      align: 'end',
      hideable: false,
      cell: (c) => (
        <Dropdown
          trigger={({ toggle }) => (
            <IconButton label={C('rowActions')} size="sm" onClick={toggle}>
              <MoreHorizontal />
            </IconButton>
          )}
          items={[
            { label: t('common.edit'), icon: <Pencil />, onClick: () => openEdit(c) },
            { divider: true, label: '' },
            { label: t('common.delete'), icon: <Trash2 />, danger: true, onClick: () => setToDelete(c) },
          ]}
        />
      ),
    },
  ]

  const s = stats.data
  const roi = s && s.budget ? s.revenue / s.budget : 0
  return (
    <>
      <PageHeader
        title={C('title')}
        description={C('description')}
        breadcrumbs={[{ label: t('nav.marketing') }, { label: C('title') }]}
        actions={
          <>
            <Button variant="outline" icon={<Download className="size-4" />} onClick={exportCsv}>
              {t('common.exportCsv')}
            </Button>
            <Button icon={<Plus className="size-4" />} onClick={openCreate}>
              {C('create')}
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label={C('stats.active')} value={s ? formatNumber(s.active) : '—'} icon={<Radio />} tone="success" loading={!s} />
        <StatCard label={C('stats.scheduled')} value={s ? formatNumber(s.scheduled) : '—'} icon={<CalendarClock />} loading={!s} />
        <StatCard label={C('stats.revenue')} value={s ? <Money value={s.revenue} compact /> : '—'} icon={<Wallet />} loading={!s} />
        <StatCard label={C('stats.orders')} value={s ? formatNumber(s.orders) : '—'} icon={<ShoppingBag />} loading={!s} />
        <StatCard
          label={C('stats.roi')}
          value={s ? <span dir="ltr">{C('roiValue', { value: roi.toFixed(1) })}</span> : '—'}
          icon={<TrendingUp />}
          loading={!s}
          period={
            s ? (
              <span className="inline-flex items-center gap-1">
                {C('stats.roiHint')} · <Money value={s.budget} compact />
              </span>
            ) : undefined
          }
        />
      </div>

      <DataTable
        tableId="campaigns"
        columns={columns}
        rows={list.data?.items}
        rowKey={(c) => c.id}
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
        onRowClick={openEdit}
        toolbar={
          <>
            <SearchInput value={searchDraft} onChange={setSearchDraft} placeholder={C('searchPlaceholder')} className="w-full sm:w-64" />
            <Segmented
              size="sm"
              value={status}
              onChange={(v) => ls.setFilter('status', v === 'all' ? undefined : v)}
              options={(['all', ...CAMPAIGN_STATUSES] as ('all' | CampaignStatus)[]).map((v) => ({ value: v, label: v === 'all' ? t('common.all') : t(`status.${v}`) }))}
            />
            <Select
              aria-label={C('cols.type')}
              value={type}
              onChange={(e) => ls.setFilter('type', e.target.value || undefined)}
              placeholder={t('marketing.shared.allTypes')}
              options={CAMPAIGN_TYPES.map((v) => ({ value: v, label: t(`marketing.shared.campaignTypes.${v}`) }))}
              wrapperClassName="w-full sm:w-52"
            />
          </>
        }
        empty={<EmptyState icon={<Megaphone />} title={C('emptyTitle')} description={C('emptyDesc')} action={{ label: C('create'), onClick: openCreate, icon: <Plus className="size-4" /> }} />}
      />

      <CampaignDrawer open={drawerOpen} campaign={editing} onClose={() => setDrawerOpen(false)} onSaved={refresh} />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={C('deleteTitle')}
        description={C('deleteDesc', { name: toDelete?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={async () => {
          if (!toDelete) return
          await deleteCampaign(toDelete.id)
          toast.success(C('deletedToast', { name: toDelete.name }))
          refresh()
        }}
      />
    </>
  )
}
