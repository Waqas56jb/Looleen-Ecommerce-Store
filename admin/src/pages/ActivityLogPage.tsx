import { useMemo, useState } from 'react'
import { Download, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, Badge, Button, DataTable, DatePicker, Drawer, PageHeader, SearchInput, Select, StatusBadge, type Column, type Tone } from '@/components/ui'
import { useAsync, useDebounce, useDocumentTitle, useListState } from '@/hooks'
import { useT } from '@/i18n'
import { getActivity, getAdmins } from '@/services/systemService'
import type { ActivityAction, ActivityEntity, ActivityLog } from '@/types'
import { downloadCsv, formatDateTime } from '@/utils'
import { useEffect } from 'react'

const ACTIONS: ActivityAction[] = ['created', 'updated', 'deleted', 'status_changed', 'published', 'unpublished', 'approved', 'rejected', 'refunded', 'adjusted', 'login', 'logout', 'exported', 'archived', 'duplicated']
const ENTITIES: ActivityEntity[] = ['product', 'order', 'customer', 'brand', 'category', 'coupon', 'campaign', 'offer', 'banner', 'review', 'return', 'inventory', 'settings', 'session', 'content']

const ACTION_TONE: Partial<Record<ActivityAction, Tone>> = {
  created: 'success',
  published: 'success',
  approved: 'success',
  updated: 'info',
  status_changed: 'info',
  adjusted: 'champagne',
  duplicated: 'champagne',
  deleted: 'error',
  rejected: 'error',
  refunded: 'rose',
  archived: 'neutral',
  unpublished: 'neutral',
  login: 'dark',
  logout: 'neutral',
  exported: 'neutral',
}

const FILTER_KEYS = ['user', 'action', 'entity', 'from', 'to']

export default function ActivityLogPage() {
  const { t, lang } = useT()
  useDocumentTitle(t('nav.activity'))
  const ls = useListState({ sortBy: 'date', sortDir: 'desc', pageSize: 25 })
  const [q, setQ] = useState(ls.search)
  const debounced = useDebounce(q, 300)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  useEffect(() => {
    if (debounced !== ls.search) ls.setSearch(debounced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const filters = { userId: ls.filter('user') || undefined, action: ls.filter('action') || undefined, entity: ls.filter('entity') || undefined, from: ls.filter('from') || undefined, to: ls.filter('to') || undefined }
  const fkey = JSON.stringify(filters)
  const { data, loading, error, reload } = useAsync(() => getActivity({ ...ls.query, filters }), [ls.query, fkey])
  const admins = useAsync(getAdmins, [])
  const activeCount = FILTER_KEYS.filter((k) => ls.filter(k)).length

  const userOptions = useMemo(() => [...(admins.data ?? []).map((a) => ({ value: a.id, label: a.name })), { value: 'system', label: t('system.activity.system') }], [admins.data, t])

  const exportCsv = async () => {
    setExporting(true)
    try {
      const res = await getActivity({ ...ls.query, page: 1, pageSize: 10000, filters })
      downloadCsv(
        'activity-log',
        res.items.map((a) => ({ Date: formatDateTime(a.date, 'en'), User: a.userName, Action: a.action, Entity: a.entity, 'Entity ID': a.entityId ?? '', Description: a.description, IP: a.ip, Status: a.status })),
      )
      toast.success(t('common.exported', { count: res.items.length }))
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<ActivityLog>[] = [
    {
      id: 'user',
      header: t('system.activity.user'),
      sortKey: 'userName',
      mobile: 'title',
      cell: (a) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={a.userName} size="sm" />
          <span className="truncate font-medium text-ink">{a.userId === 'system' ? t('system.activity.system') : a.userName}</span>
        </span>
      ),
    },
    { id: 'action', header: t('system.activity.action'), sortKey: 'action', mobile: 'end', cell: (a) => <Badge tone={ACTION_TONE[a.action] ?? 'neutral'}>{t(`system.activity.actions.${a.action}`)}</Badge> },
    { id: 'entity', header: t('system.activity.entity'), sortKey: 'entity', mobile: 'meta', cell: (a) => <span className="text-ink">{t(`system.activity.entities.${a.entity}`)}</span> },
    { id: 'description', header: t('system.activity.colDescription'), mobile: 'subtitle', cell: (a) => <span className="line-clamp-2 max-w-md text-muted">{a.description}</span> },
    { id: 'date', header: t('common.date'), sortKey: 'date', mobile: 'meta', cell: (a) => <span className="whitespace-nowrap tabular-nums">{formatDateTime(a.date, lang)}</span> },
    {
      id: 'ip',
      header: t('system.activity.ip'),
      mobile: 'meta',
      defaultHidden: false,
      cell: (a) => (
        <span dir="ltr" className="font-mono text-xs text-muted">
          {a.ip}
        </span>
      ),
    },
    { id: 'status', header: t('common.status'), sortKey: 'status', mobile: 'meta', cell: (a) => <StatusBadge status={a.status} /> },
  ]

  const filterControls = (
    <>
      <Select aria-label={t('system.activity.user')} label={filtersOpen ? t('system.activity.user') : undefined} value={ls.filter('user')} onChange={(e) => ls.setFilter('user', e.target.value)} placeholder={t('system.activity.allUsers')} options={userOptions} />
      <Select
        aria-label={t('system.activity.action')}
        label={filtersOpen ? t('system.activity.action') : undefined}
        value={ls.filter('action')}
        onChange={(e) => ls.setFilter('action', e.target.value)}
        placeholder={t('system.activity.allActions')}
        options={ACTIONS.map((x) => ({ value: x, label: t(`system.activity.actions.${x}`) }))}
      />
      <Select
        aria-label={t('system.activity.entity')}
        label={filtersOpen ? t('system.activity.entity') : undefined}
        value={ls.filter('entity')}
        onChange={(e) => ls.setFilter('entity', e.target.value)}
        placeholder={t('system.activity.allEntities')}
        options={ENTITIES.map((x) => ({ value: x, label: t(`system.activity.entities.${x}`) }))}
      />
      <DatePicker aria-label={t('common.from')} label={filtersOpen ? t('common.from') : undefined} value={ls.filter('from')} max={ls.filter('to') || undefined} onChange={(v) => ls.setFilter('from', v)} />
      <DatePicker aria-label={t('common.to')} label={filtersOpen ? t('common.to') : undefined} value={ls.filter('to')} min={ls.filter('from') || undefined} onChange={(v) => ls.setFilter('to', v)} />
    </>
  )

  return (
    <>
      <PageHeader
        title={t('nav.activity')}
        description={t('system.activity.description')}
        breadcrumbs={[{ label: t('nav.activity') }]}
        actions={
          <Button variant="outline" icon={<Download className="size-4" />} onClick={exportCsv} loading={exporting} disabled={!data?.total}>
            {t('common.exportCsv')}
          </Button>
        }
      />
      <DataTable
        tableId="activity"
        columns={columns}
        rows={data?.items}
        rowKey={(a) => a.id}
        loading={loading}
        error={error}
        onRetry={reload}
        total={data?.total}
        page={data?.page ?? ls.page}
        pageSize={ls.pageSize}
        onPageChange={ls.setPage}
        onPageSizeChange={ls.setPageSize}
        sortBy={ls.sortBy}
        sortDir={ls.sortDir}
        onSort={ls.setSort}
        toolbar={
          <>
            <SearchInput value={q} onChange={setQ} placeholder={t('system.activity.search')} className="w-full sm:w-64" />
            <div className="hidden flex-wrap items-center gap-2 xl:flex [&>div]:w-40">{!filtersOpen && filterControls}</div>
            <Button variant="outline" size="md" className="xl:hidden" icon={<SlidersHorizontal className="size-4" />} onClick={() => setFiltersOpen(true)}>
              {t('common.filters')}
              {activeCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] text-white">{activeCount}</span>}
            </Button>
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => ls.clearFilters(FILTER_KEYS)}>
                {t('common.clearAll')}
              </Button>
            )}
          </>
        }
      />
      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t('common.filters')}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => ls.clearFilters(FILTER_KEYS)}>
              {t('common.clearAll')}
            </Button>
            <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
              {t('common.apply')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-5">{filtersOpen && filterControls}</div>
      </Drawer>
    </>
  )
}
