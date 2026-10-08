import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, Copy, Download, Eye, EyeOff, Image as ImageIcon, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, ButtonLink, ConfirmDialog, DataTable, Dropdown, EmptyState, IconButton, Img, PageHeader, SearchInput, Segmented, StatusBadge, Tabs, type Column } from '@/components/ui'
import { BANNER_STATUSES, ctr, PLACEMENTS } from '@/components/content/bannerMeta'
import { useDebouncedSearch } from '@/components/marketing/shared'
import { useAsync, useDocumentTitle, useListState } from '@/hooks'
import { useT } from '@/i18n'
import { deleteBanner, duplicateBanner, getBanners, publishBanner, updateBanner } from '@/services/marketingService'
import type { Banner, BannerPlacement } from '@/types'
import { downloadCsv, formatCompact, formatDate } from '@/utils'

type Tab = 'all' | BannerPlacement
type StatusFilter = 'all' | Banner['status']

export default function BannersPage() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const N = (k: string, v?: Record<string, string | number>) => t(`marketing.banners.${k}`, v)
  useDocumentTitle(N('title'))
  const ls = useListState({ sortBy: 'sortOrder', sortDir: 'asc' })
  const [searchDraft, setSearchDraft] = useDebouncedSearch(ls.search, ls.setSearch)
  const tab = (ls.filter('placement') || 'all') as Tab
  const status = (ls.filter('status') || 'all') as StatusFilter
  const filters = useMemo(() => ({ placement: tab === 'all' ? undefined : tab, status: status === 'all' ? undefined : status }), [tab, status])

  const list = useAsync(() => getBanners({ ...ls.query, filters }), [ls.query, filters])
  /** Unfiltered set: tab counts + priority neighbours */
  const everything = useAsync(() => getBanners({ pageSize: 1000, sortBy: 'sortOrder', sortDir: 'asc' }), [])
  const [toDelete, setToDelete] = useState<Banner | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = () => {
    list.reload()
    everything.reload()
  }
  const name = (b: Banner) => (lang === 'ar' ? b.titleAr : b.title)

  const siblings = (b: Banner) => (everything.data?.items ?? []).filter((x) => x.placement === b.placement).sort((a, z) => a.sortOrder - z.sortOrder || a.createdAt.localeCompare(z.createdAt))

  const move = async (b: Banner, dir: -1 | 1) => {
    const sibs = siblings(b)
    const i = sibs.findIndex((x) => x.id === b.id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= sibs.length) return
    const next = [...sibs]
    ;[next[i], next[j]] = [next[j], next[i]]
    setBusyId(b.id)
    try {
      await Promise.all(next.map((x, idx) => (x.sortOrder !== idx + 1 ? updateBanner(x.id, { sortOrder: idx + 1 }) : null)))
      toast.success(N('reorderedToast'))
      refresh()
    } finally {
      setBusyId(null)
    }
  }

  const togglePublish = async (b: Banner) => {
    const publish = b.status !== 'published'
    await publishBanner(b.id, publish)
    toast.success(N(publish ? 'publishedToast' : 'unpublishedToast', { name: name(b) }))
    refresh()
  }

  const duplicate = async (b: Banner) => {
    await duplicateBanner(b.id)
    toast.success(N('duplicatedToast', { name: name(b) }))
    refresh()
  }

  const exportCsv = async () => {
    const all = await getBanners({ ...ls.query, page: 1, pageSize: 10000, filters })
    downloadCsv(
      'banners',
      all.items.map((b) => ({
        Title: b.title,
        'Arabic title': b.titleAr,
        Placement: t(`marketing.shared.placements.${b.placement}`),
        Status: t(`status.${b.status}`),
        Start: b.startDate.slice(0, 10),
        End: b.endDate.slice(0, 10),
        Priority: b.sortOrder,
        'CTA URL': b.ctaUrl,
        Clicks: b.clicks,
        Impressions: b.impressions,
        'CTR %': ctr(b).toFixed(2),
      })),
    )
    toast.success(t('common.exported', { count: all.items.length }))
  }

  const columns: Column<Banner>[] = [
    {
      id: 'preview',
      header: N('cols.preview'),
      mobile: 'hidden',
      width: '128px',
      cell: (b) => (
        <span className="block w-28 overflow-hidden rounded-md border border-line-soft">
          <Img src={b.imageDesktop} alt={name(b)} w={320} h={180} className="aspect-video w-full" />
        </span>
      ),
    },
    {
      id: 'title',
      header: N('cols.title'),
      sortKey: 'title',
      mobile: 'title',
      hideable: false,
      cell: (b) => (
        <div className="flex min-w-48 items-center gap-3">
          <span className="block w-20 shrink-0 overflow-hidden rounded border border-line-soft md:hidden">
            <Img src={b.imageDesktop} alt="" w={200} h={112} className="aspect-video w-full" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{name(b)}</p>
            <p className="truncate text-xs text-muted">
              <bdi>{lang === 'ar' ? b.title : b.titleAr}</bdi>
            </p>
            <p className="truncate text-[11px] text-subtle" dir="ltr">
              {b.ctaUrl}
            </p>
          </div>
        </div>
      ),
    },
    { id: 'placement', header: N('cols.placement'), sortKey: 'placement', mobile: 'subtitle', cell: (b) => <span className="whitespace-nowrap">{t(`marketing.shared.placements.${b.placement}`)}</span> },
    { id: 'status', header: N('cols.status'), sortKey: 'status', mobile: 'end', cell: (b) => <StatusBadge status={b.status} /> },
    { id: 'start', header: N('cols.start'), sortKey: 'startDate', cell: (b) => <span className="whitespace-nowrap text-muted">{formatDate(b.startDate, lang)}</span> },
    { id: 'end', header: N('cols.end'), sortKey: 'endDate', cell: (b) => <span className="whitespace-nowrap text-muted">{formatDate(b.endDate, lang)}</span> },
    {
      id: 'priority',
      header: N('cols.priority'),
      sortKey: 'sortOrder',
      cell: (b) => {
        const sibs = siblings(b)
        const i = sibs.findIndex((x) => x.id === b.id)
        return (
          <div className="flex items-center gap-1" data-no-row-click>
            <span className="w-6 text-center font-medium tabular-nums">{b.sortOrder}</span>
            <IconButton label={N('moveUp')} size="xs" variant="outline" disabled={i <= 0 || busyId !== null} onClick={() => move(b, -1)}>
              <ArrowUp />
            </IconButton>
            <IconButton label={N('moveDown')} size="xs" variant="outline" disabled={i < 0 || i >= sibs.length - 1 || busyId !== null} onClick={() => move(b, 1)}>
              <ArrowDown />
            </IconButton>
          </div>
        )
      },
    },
    {
      id: 'ctr',
      header: N('cols.ctr'),
      align: 'end',
      cell: (b) => (
        <div className="text-end">
          <p className="font-medium tabular-nums" dir="ltr">
            {ctr(b).toFixed(2)}%
          </p>
          <p className="text-[11px] whitespace-nowrap text-subtle">{N('clicks', { clicks: formatCompact(b.clicks), impressions: formatCompact(b.impressions) })}</p>
        </div>
      ),
    },
    {
      id: 'actions',
      header: <span className="sr-only">{t('common.actions')}</span>,
      align: 'end',
      hideable: false,
      cell: (b) => (
        <Dropdown
          trigger={({ toggle }) => (
            <IconButton label={N('rowActions')} size="sm" onClick={toggle}>
              <MoreHorizontal />
            </IconButton>
          )}
          items={[
            { label: t('common.edit'), icon: <Pencil />, onClick: () => navigate(`/banners/${b.id}/edit`) },
            { label: t('common.duplicate'), icon: <Copy />, onClick: () => duplicate(b) },
            { label: b.status === 'published' ? N('unpublish') : N('publish'), icon: b.status === 'published' ? <EyeOff /> : <Eye />, onClick: () => togglePublish(b) },
            { divider: true, label: '' },
            { label: t('common.delete'), icon: <Trash2 />, danger: true, onClick: () => setToDelete(b) },
          ]}
        />
      ),
    },
  ]

  const all = everything.data?.items ?? []
  const tabs = [{ value: 'all' as Tab, label: N('all'), count: everything.data ? all.length : undefined }, ...PLACEMENTS.map((p) => ({ value: p as Tab, label: t(`marketing.shared.placements.${p}`), count: everything.data ? all.filter((b) => b.placement === p).length : undefined }))]

  return (
    <>
      <PageHeader
        title={N('title')}
        description={N('description')}
        breadcrumbs={[{ label: t('nav.content') }, { label: N('title') }]}
        actions={
          <>
            <Button variant="outline" icon={<Download className="size-4" />} onClick={exportCsv}>
              {t('common.exportCsv')}
            </Button>
            <ButtonLink to={tab === 'all' ? '/banners/new' : `/banners/new?placement=${tab}`} icon={<Plus className="size-4" />}>
              {N('create')}
            </ButtonLink>
          </>
        }
      />

      <Tabs tabs={tabs} value={tab} onChange={(v) => ls.setFilter('placement', v === 'all' ? undefined : v)} className="mb-4" />

      <DataTable
        tableId="banners"
        columns={columns}
        rows={list.data?.items}
        rowKey={(b) => b.id}
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
        onRowClick={(b) => navigate(`/banners/${b.id}/edit`)}
        toolbar={
          <>
            <SearchInput value={searchDraft} onChange={setSearchDraft} placeholder={N('searchPlaceholder')} className="w-full sm:w-64" />
            <Segmented
              size="sm"
              value={status}
              onChange={(v) => ls.setFilter('status', v === 'all' ? undefined : v)}
              options={(['all', ...BANNER_STATUSES] as StatusFilter[]).map((v) => ({ value: v, label: v === 'all' ? t('common.all') : t(`status.${v}`) }))}
            />
          </>
        }
        empty={<EmptyState icon={<ImageIcon />} title={N('emptyTitle')} description={N('emptyDesc')} action={{ label: N('create'), to: tab === 'all' ? '/banners/new' : `/banners/new?placement=${tab}`, icon: <Plus className="size-4" /> }} />}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={N('deleteTitle')}
        description={N('deleteDesc', { name: toDelete ? name(toDelete) : '' })}
        confirmLabel={t('common.delete')}
        onConfirm={async () => {
          if (!toDelete) return
          await deleteBanner(toDelete.id)
          toast.success(N('deletedToast', { name: name(toDelete) }))
          refresh()
        }}
      />
    </>
  )
}
