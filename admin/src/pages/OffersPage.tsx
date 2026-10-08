import { useMemo, useState } from 'react'
import { CalendarDays, Gift, Layers, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, ConfirmDialog, EmptyState, ErrorState, IconButton, Img, Money, PageHeader, Pagination, SearchInput, Segmented, Skeleton, StatusBadge } from '@/components/ui'
import { OfferDrawer } from '@/components/marketing/OfferDrawer'
import { useDebouncedSearch } from '@/components/marketing/shared'
import { useAsync, useDocumentTitle, useListState } from '@/hooks'
import { useT } from '@/i18n'
import { deleteOffer, getOffers } from '@/services/marketingService'
import type { Offer } from '@/types'
import { formatDate } from '@/utils'

type StatusFilter = 'all' | Offer['status']
const STATUSES: StatusFilter[] = ['all', 'active', 'scheduled', 'expired', 'disabled']

export default function OffersPage() {
  const { t, lang } = useT()
  const O = (k: string, v?: Record<string, string | number>) => t(`marketing.offers.${k}`, v)
  useDocumentTitle(O('title'))
  const ls = useListState({ sortBy: 'startDate', sortDir: 'desc', pageSize: 12 })
  const [searchDraft, setSearchDraft] = useDebouncedSearch(ls.search, ls.setSearch)
  const status = (ls.filter('status') || 'all') as StatusFilter
  const filters = useMemo(() => ({ status: status === 'all' ? undefined : status }), [status])
  const list = useAsync(() => getOffers({ ...ls.query, filters }), [ls.query, filters])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Offer | null>(null)
  const [toDelete, setToDelete] = useState<Offer | null>(null)

  const openCreate = () => {
    setEditing(null)
    setDrawerOpen(true)
  }
  const openEdit = (o: Offer) => {
    setEditing(o)
    setDrawerOpen(true)
  }

  const scope = (o: Offer) => {
    const parts: string[] = []
    if (o.productIds.length) parts.push(O('productsCount', { count: o.productIds.length }))
    if (o.categoryIds.length) parts.push(O('categoriesCount', { count: o.categoryIds.length }))
    if (o.brandIds.length) parts.push(O('brandsCount', { count: o.brandIds.length }))
    return parts.length ? parts.join(' · ') : O('sitewide')
  }

  const data = list.data
  return (
    <>
      <PageHeader
        title={O('title')}
        description={O('description')}
        breadcrumbs={[{ label: t('nav.marketing') }, { label: O('title') }]}
        meta={data ? <span className="rounded bg-mist px-2 py-0.5 text-xs text-muted tabular-nums">{O('offerCount', { count: data.total })}</span> : undefined}
        actions={
          <Button icon={<Plus className="size-4" />} onClick={openCreate}>
            {O('create')}
          </Button>
        }
      />

      <div className="card mb-6 flex flex-wrap items-center gap-2 px-3 py-3 sm:px-4">
        <SearchInput value={searchDraft} onChange={setSearchDraft} placeholder={O('searchPlaceholder')} className="w-full sm:w-64" />
        <Segmented size="sm" value={status} onChange={(v) => ls.setFilter('status', v === 'all' ? undefined : v)} options={STATUSES.map((v) => ({ value: v, label: v === 'all' ? t('common.all') : t(`status.${v}`) }))} />
      </div>

      {list.error ? (
        <Card>
          <ErrorState onRetry={list.reload} />
        </Card>
      ) : !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="card overflow-hidden">
              <Skeleton className="aspect-[16/9] rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <Card>
          <EmptyState icon={<Gift />} title={O('emptyTitle')} description={O('emptyDesc')} action={{ label: O('create'), onClick: openCreate, icon: <Plus className="size-4" /> }} />
        </Card>
      ) : (
        <>
          <ul className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 ${list.loading ? 'opacity-60 transition-opacity' : ''}`}>
            {data.items.map((o) => {
              const primary = lang === 'ar' ? o.titleAr : o.title
              const secondary = lang === 'ar' ? o.title : o.titleAr
              return (
                <li key={o.id} className="card group flex min-w-0 flex-col overflow-hidden">
                  <button type="button" onClick={() => openEdit(o)} className="relative block aspect-[16/9] overflow-hidden text-start" aria-label={`${t('common.edit')} ${primary}`}>
                    <Img src={o.banner} alt={primary} w={720} h={405} className="absolute inset-0 size-full transition-transform duration-500 group-hover:scale-[1.02]" />
                    <span className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" aria-hidden />
                    <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink shadow-card">
                      {o.discountType === 'percentage' ? (
                        t('marketing.shared.percentOff', { value: o.discountValue })
                      ) : (
                        <>
                          <Money value={o.discountValue} /> {t('marketing.shared.off')}
                        </>
                      )}
                    </span>
                    <span className="absolute end-3 top-3">
                      <StatusBadge status={o.status} className="bg-white" />
                    </span>
                  </button>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-semibold text-ink">{primary}</h3>
                      <p className="truncate text-[13px] text-muted">
                        <bdi>{secondary}</bdi>
                      </p>
                    </div>
                    {o.description && <p className="line-clamp-2 text-xs text-muted">{o.description}</p>}
                    <dl className="mt-auto space-y-1.5 text-xs text-muted">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-3.5 shrink-0 text-subtle" aria-hidden />
                        <dt className="sr-only">{t('common.date')}</dt>
                        <dd>
                          {formatDate(o.startDate, lang)} – {formatDate(o.endDate, lang)}
                        </dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="size-3.5 shrink-0 text-subtle" aria-hidden />
                        <dt className="sr-only">{O('appliesTo')}</dt>
                        <dd className="truncate">{scope(o)}</dd>
                      </div>
                    </dl>
                    <div className="flex items-center justify-end gap-1 border-t border-line-soft pt-3">
                      <Button variant="ghost" size="sm" icon={<Pencil className="size-3.5" />} onClick={() => openEdit(o)}>
                        {t('common.edit')}
                      </Button>
                      <IconButton label={t('common.delete')} size="sm" variant="danger" onClick={() => setToDelete(o)}>
                        <Trash2 />
                      </IconButton>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          {data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between gap-3 text-[13px] text-muted">
              <span className="tabular-nums">{t('common.showing', { from: (data.page - 1) * data.pageSize + 1, to: Math.min(data.total, data.page * data.pageSize), total: data.total })}</span>
              <Pagination page={data.page} totalPages={data.totalPages} onChange={ls.setPage} />
            </div>
          )}
        </>
      )}

      <OfferDrawer open={drawerOpen} offer={editing} onClose={() => setDrawerOpen(false)} onSaved={list.reload} />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={O('deleteTitle')}
        description={O('deleteDesc', { name: toDelete?.title ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={async () => {
          if (!toDelete) return
          await deleteOffer(toDelete.id)
          toast.success(O('deletedToast', { name: toDelete.title }))
          list.reload()
        }}
      />
    </>
  )
}
