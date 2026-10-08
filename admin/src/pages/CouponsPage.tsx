import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgePercent, CalendarClock, Copy, Download, MoreHorizontal, Pencil, Plus, Power, ReceiptText, Ticket, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, ButtonLink, ConfirmDialog, DataTable, Dropdown, EmptyState, IconButton, Money, PageHeader, ProgressBar, SearchInput, Segmented, Select, StatCard, StatusBadge, type Column } from '@/components/ui'
import { CodePill, useDebouncedSearch } from '@/components/marketing/shared'
import { CouponValue, couponValueText } from '@/components/coupons/CouponValue'
import { useAsync, useDocumentTitle, useListState } from '@/hooks'
import { useT } from '@/i18n'
import { createCoupon, deleteCoupon, getCoupons, getCouponStats, isCouponCodeTaken, updateCoupon, type CouponRow } from '@/services/marketingService'
import type { CouponStatus, CouponType } from '@/types'
import { downloadCsv, formatDate, formatNumber } from '@/utils'

const STATUSES: ('all' | CouponStatus)[] = ['all', 'active', 'scheduled', 'expired', 'disabled']
const TYPES: CouponType[] = ['percentage', 'fixed', 'free_shipping']

export default function CouponsPage() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  useDocumentTitle(t('marketing.coupons.title'))
  const ls = useListState({ sortBy: 'createdAt', sortDir: 'desc' })
  const [searchDraft, setSearchDraft] = useDebouncedSearch(ls.search, ls.setSearch)

  const status = (ls.filter('status') || 'all') as 'all' | CouponStatus
  const type = ls.filter('type')
  const filters = useMemo(() => ({ status: status === 'all' ? undefined : status, type: type || undefined }), [status, type])

  const list = useAsync(() => getCoupons({ ...ls.query, filters }), [ls.query, filters])
  const stats = useAsync(() => getCouponStats(), [])
  const [toDelete, setToDelete] = useState<CouponRow | null>(null)
  const C = (k: string, v?: Record<string, string | number>) => t(`marketing.coupons.${k}`, v)

  const refresh = () => {
    list.reload()
    stats.reload()
  }

  const toggle = async (c: CouponRow) => {
    await updateCoupon(c.id, { enabled: !c.enabled })
    toast.success(C(c.enabled ? 'disabledToast' : 'enabledToast', { code: c.code }))
    refresh()
  }

  const duplicate = async (c: CouponRow) => {
    let code = `${c.code}-COPY`
    let n = 2
    while (isCouponCodeTaken(code)) code = `${c.code}-COPY${n++}`
    await createCoupon({
      code,
      description: c.description,
      type: c.type,
      value: c.value,
      minOrder: c.minOrder,
      maxDiscount: c.maxDiscount,
      usageLimit: c.usageLimit,
      perCustomerLimit: c.perCustomerLimit,
      startDate: c.startDate,
      endDate: c.endDate,
      categoryIds: c.categoryIds,
      brandIds: c.brandIds,
      segment: c.segment,
      enabled: false,
    })
    toast.success(C('duplicatedToast', { code }))
    refresh()
  }

  const exportCsv = async () => {
    const all = await getCoupons({ ...ls.query, page: 1, pageSize: 10000, filters })
    downloadCsv(
      'coupons',
      all.items.map((c) => ({
        Code: c.code,
        Description: c.description,
        Type: t(`marketing.shared.couponTypes.${c.type}`),
        Value: couponValueText(c),
        'Min order (SAR)': c.minOrder,
        'Max discount (SAR)': c.maxDiscount ?? '',
        Used: c.used,
        'Usage limit': c.usageLimit ?? 'Unlimited',
        'Per customer': c.perCustomerLimit ?? 'Unlimited',
        'Discount given (SAR)': c.discountGiven,
        Start: c.startDate.slice(0, 10),
        End: c.endDate.slice(0, 10),
        Segment: t(`marketing.shared.segments.${c.segment}`),
        Status: t(`status.${c.status}`),
      })),
    )
    toast.success(t('common.exported', { count: all.items.length }))
  }

  const columns: Column<CouponRow>[] = [
    { id: 'code', header: C('cols.code'), sortKey: 'code', mobile: 'title', hideable: false, cell: (c) => <CodePill code={c.code} /> },
    {
      id: 'type',
      header: C('cols.type'),
      sortKey: 'type',
      mobile: 'subtitle',
      cell: (c) => <span className="text-muted">{t(`marketing.shared.couponTypes.${c.type}`)}</span>,
    },
    { id: 'value', header: C('cols.value'), sortKey: 'value', align: 'end', mobile: 'end', cell: (c) => <CouponValue coupon={c} className="font-semibold tabular-nums" /> },
    {
      id: 'usage',
      header: C('cols.usage'),
      sortKey: 'used',
      cell: (c) => (
        <div className="min-w-28">
          <p className="text-[12.5px] tabular-nums" dir="ltr">
            <span className="font-medium text-ink">{formatNumber(c.used)}</span>
            <span className="text-subtle"> / {c.usageLimit ? formatNumber(c.usageLimit) : '∞'}</span>
          </p>
          {c.usageLimit ? <ProgressBar value={c.used / c.usageLimit} tone={c.used >= c.usageLimit ? 'error' : c.used / c.usageLimit > 0.8 ? 'warning' : 'rose'} className="mt-1" /> : null}
        </div>
      ),
    },
    {
      id: 'limit',
      header: C('cols.limit'),
      defaultHidden: false,
      cell: (c) => (
        <div className="text-[12.5px]">
          <p>{c.usageLimit ? formatNumber(c.usageLimit) : t('marketing.shared.unlimited')}</p>
          {c.perCustomerLimit && <p className="text-xs text-muted">{C('perCustomer', { count: c.perCustomerLimit })}</p>}
        </div>
      ),
    },
    { id: 'start', header: C('cols.start'), sortKey: 'startDate', cell: (c) => <span className="whitespace-nowrap text-muted">{formatDate(c.startDate, lang)}</span> },
    { id: 'end', header: C('cols.end'), sortKey: 'endDate', cell: (c) => <span className="whitespace-nowrap text-muted">{formatDate(c.endDate, lang)}</span> },
    { id: 'segment', header: C('cols.segment'), sortKey: 'segment', cell: (c) => <span className="whitespace-nowrap">{t(`marketing.shared.segments.${c.segment}`)}</span> },
    { id: 'status', header: C('cols.status'), sortKey: 'status', mobile: 'end', cell: (c) => <StatusBadge status={c.status} /> },
    {
      id: 'actions',
      header: <span className="sr-only">{t('common.actions')}</span>,
      align: 'end',
      hideable: false,
      cell: (c) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton label={t('common.edit')} size="sm" onClick={() => navigate(`/coupons/${c.id}/edit`)} className="max-md:hidden">
            <Pencil />
          </IconButton>
          <Dropdown
            trigger={({ toggle: open }) => (
              <IconButton label={C('rowActions')} size="sm" onClick={open}>
                <MoreHorizontal />
              </IconButton>
            )}
            items={[
              { label: t('common.edit'), icon: <Pencil />, onClick: () => navigate(`/coupons/${c.id}/edit`) },
              { label: c.enabled ? C('disable') : C('enable'), icon: <Power />, onClick: () => toggle(c) },
              { label: t('common.duplicate'), icon: <Copy />, onClick: () => duplicate(c) },
              { divider: true, label: '' },
              { label: t('common.delete'), icon: <Trash2 />, danger: true, onClick: () => setToDelete(c) },
            ]}
          />
        </div>
      ),
    },
  ]

  const s = stats.data
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
            <ButtonLink to="/coupons/new" icon={<Plus className="size-4" />}>
              {C('create')}
            </ButtonLink>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={C('stats.active')} value={s ? formatNumber(s.active) : '—'} icon={<Ticket />} tone="success" loading={!s} period={s ? C('stats.disabled', { count: s.disabled }) : undefined} />
        <StatCard label={C('stats.redemptions')} value={s ? formatNumber(s.redemptions) : '—'} icon={<ReceiptText />} loading={!s} period={C('stats.allTime')} />
        <StatCard label={C('stats.discountGiven')} value={s ? <Money value={s.discountGiven} /> : '—'} icon={<BadgePercent />} loading={!s} period={C('stats.allTime')} />
        <StatCard label={C('stats.expired')} value={s ? formatNumber(s.expired) : '—'} icon={<CalendarClock />} loading={!s} period={s ? C('stats.scheduled', { count: s.scheduled }) : undefined} />
      </div>

      <DataTable
        tableId="coupons"
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
        onRowClick={(c) => navigate(`/coupons/${c.id}/edit`)}
        toolbar={
          <>
            <SearchInput value={searchDraft} onChange={setSearchDraft} placeholder={C('searchPlaceholder')} className="w-full sm:w-64" />
            <Segmented size="sm" value={status} onChange={(v) => ls.setFilter('status', v === 'all' ? undefined : v)} options={STATUSES.map((v) => ({ value: v, label: v === 'all' ? t('common.all') : t(`status.${v}`) }))} />
            <Select
              aria-label={C('cols.type')}
              value={type}
              onChange={(e) => ls.setFilter('type', e.target.value || undefined)}
              placeholder={t('marketing.shared.allTypes')}
              options={TYPES.map((v) => ({ value: v, label: t(`marketing.shared.couponTypes.${v}`) }))}
              wrapperClassName="w-full sm:w-44"
            />
          </>
        }
        empty={<EmptyState icon={<Ticket />} title={C('emptyTitle')} description={C('emptyDesc')} action={{ label: C('create'), to: '/coupons/new', icon: <Plus className="size-4" /> }} />}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={C('deleteTitle', { code: toDelete?.code ?? '' })}
        description={C('deleteDesc')}
        confirmLabel={t('common.delete')}
        onConfirm={async () => {
          if (!toDelete) return
          await deleteCoupon(toDelete.id)
          toast.success(C('deletedToast', { code: toDelete.code }))
          refresh()
        }}
      />
    </>
  )
}
