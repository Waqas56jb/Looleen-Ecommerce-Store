import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BadgeCheck, CheckCircle2, ClipboardCheck, ExternalLink, Pencil, Plus, RotateCcw, Search, ShieldAlert, Trash2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, IconButton, Input, KeyValue, Modal, Money, PageHeader, PageSkeleton, Textarea, Timeline, Tooltip } from '@/components/ui'
import { PriceFormModal } from '@/components/sourcing/PriceFormModal'
import { BrandTile, CheckList, Pct, SourcingStatusBadge } from '@/components/sourcing/shared'
import { displayName } from '@/components/sourcing/format'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { approveProduct, getSourcingProduct, isFresh, marginAt, rejectProduct, removePrice, reopenProduct, searchLink, setLooksPrice, verifyCost } from '@/services/sourcingService'
import type { CompetitorPrice, Retailer, SourcingEvent } from '@/types/sourcing'
import { cn, formatDate, formatDateTime, formatNumber } from '@/utils'

const EVENT_TONE: Record<SourcingEvent['action'], 'done' | 'current' | 'error'> = {
  imported: 'done',
  cost_verified: 'done',
  price_added: 'done',
  price_updated: 'done',
  price_removed: 'done',
  approved: 'current',
  rejected: 'error',
  reopened: 'done',
}

export default function SourcingDetailPage() {
  const { id = '' } = useParams()
  const { t, lang } = useT()
  const D = (k: string, v?: Record<string, string | number>) => t(`sourcing.detail.${k}`, v)
  const { data, loading, error, reload } = useAsync(() => getSourcingProduct(id), [id])
  const row = data?.row
  useDocumentTitle(row ? displayName(row) : t('sourcing.list.title'))

  const [priceModal, setPriceModal] = useState<{ retailerId?: string; editing?: CompetitorPrice } | null>(null)
  const [toRemove, setToRemove] = useState<CompetitorPrice | null>(null)
  // Draft LOOKS price — tied to the saved price it was started from, so it resets when that changes
  const [draftState, setDraftState] = useState<{ key: string; value: string } | null>(null)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const priceKey = `${row?.id}|${row?.looksPrice ?? ''}`
  const draftPrice = draftState?.key === priceKey ? draftState.value : row?.looksPrice ? String(row.looksPrice) : ''
  const setDraftPrice = (value: string) => setDraftState({ key: priceKey, value })

  const retailers = useMemo(() => (data ? data.retailers.filter((r) => !r.brands || r.brands.includes(data.row.brand)) : []), [data])
  const crumbs = [{ label: t('nav.sourcing') }, { label: t('sourcing.list.title'), to: '/sourcing' }]

  if (loading && !data) return <PageSkeleton stats={0} rows={8} />
  if (error) return <ErrorState onRetry={reload} />
  if (!data || !row)
    return (
      <>
        <PageHeader title={D('notFoundTitle')} breadcrumbs={crumbs} />
        <div className="card">
          <EmptyState icon={<ClipboardCheck />} title={D('notFoundTitle')} description={D('notFoundDesc')} action={{ label: D('back'), to: '/sourcing' }} />
        </div>
      </>
    )

  const { rules, suppliers } = data
  const m = row.market
  const cost = row.cost
  const draft = Number(draftPrice)
  const calc = cost !== null && draft > 0 ? marginAt(draft, cost) : null
  const blockers = row.checks.filter((c) => c.blocking && !c.ok)
  const decided = !!row.decision
  const name = displayName(row)
  const priceFor = (r: Retailer) => row.prices.filter((c) => c.retailerId === r.id).sort((a, b) => a.price - b.price)
  // Retailers with a price first, then manual ones to verify
  const orderedRetailers = [...retailers].sort((a, b) => Number(priceFor(b).length > 0) - Number(priceFor(a).length > 0) || Number(a.collection === 'manual') - Number(b.collection === 'manual'))
  const priceAt = (target: number) => (cost !== null ? Math.ceil((cost / (1 - target)) * 1.15) : null)

  const savePrice = async () => {
    setBusy(true)
    try {
      await setLooksPrice(row.id, draft > 0 ? draft : undefined)
      toast.success(D('priceSaved'))
      reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[...crumbs, { label: row.id }]}
        title={name}
        meta={<SourcingStatusBadge status={row.status} />}
        description={`${row.id} · ${row.brand} · ${row.size}`}
        actions={
          decided ? (
            <Button variant="outline" icon={<RotateCcw className="size-4" />} onClick={async () => (await reopenProduct(row.id), toast.success(D('reopenedToast')), reload())}>
              {D('reopen')}
            </Button>
          ) : (
            <>
              <Button variant="outline" icon={<XCircle className="size-4" />} className="text-error hover:text-error" onClick={() => (setNote(''), setRejectOpen(true))}>
                {D('reject')}
              </Button>
              <Tooltip content={blockers.length ? D('blockedTitle') : D('approve')}>
                <Button icon={<CheckCircle2 className="size-4" />} disabled={blockers.length > 0} onClick={() => (setNote(''), setApproveOpen(true))}>
                  {D('approve')}
                </Button>
              </Tooltip>
            </>
          )
        }
      />

      {/* Status banner */}
      <div
        role="status"
        className={cn(
          'mb-6 flex items-start gap-3 rounded-lg border px-4 py-3 text-[13px]',
          row.status === 'approved' && 'border-success/20 bg-success-soft text-success',
          row.status === 'rejected' && 'border-error/20 bg-error-soft text-error',
          row.status === 'ready' && 'border-info/20 bg-info-soft text-info',
          row.status === 'incomplete' && 'border-warning/20 bg-warning-soft text-warning',
        )}
      >
        {row.status === 'approved' ? <BadgeCheck className="mt-0.5 size-4 shrink-0" /> : row.status === 'incomplete' ? <ShieldAlert className="mt-0.5 size-4 shrink-0" /> : <ClipboardCheck className="mt-0.5 size-4 shrink-0" />}
        <p className="font-medium">
          {row.decision?.status === 'approved'
            ? D('approvedBanner', { by: row.decision.by, date: formatDate(row.decision.at, lang), price: `SAR ${formatNumber(row.decision.looksPrice ?? 0)}`, margin: ((row.decision.margin ?? 0) * 100).toFixed(1), count: row.decision.retailers ?? 0 })
            : row.decision?.status === 'rejected'
              ? D('rejectedBanner', { by: row.decision.by, date: formatDate(row.decision.at, lang), note: row.decision.note || '—' })
              : row.status === 'ready'
                ? D('readyBanner')
                : D('inactiveBanner')}
        </p>
      </div>

      {/* Decision tools first: what is missing, the market, the LOOKS price */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title={D('checklist')} description={D('checklistDesc')}>
          <CheckList checks={row.checks} />
        </Card>

        <Card title={D('market')}>
          {m.min === null ? (
            <p className="text-[13px] text-muted">{D('noMarket')}</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  [D('lowest'), m.min],
                  [D('average'), m.avg],
                  [D('highest'), m.max],
                ].map(([label, v]) => (
                  <div key={String(label)} className="rounded-md bg-mist px-2 py-2.5">
                    <p className="text-[11.5px] text-muted">{label}</p>
                    <Money value={Number(v)} className="mt-0.5 text-sm font-semibold" />
                  </div>
                ))}
              </div>
              <KeyValue
                className="mt-4"
                items={[
                  { label: D('median'), value: <Money value={m.median ?? 0} /> },
                  { label: D('lowest'), value: m.lowestAt ?? '—' },
                ]}
              />
              {cost !== null && (
                <div className="mt-4 border-t border-line-soft pt-4">
                  <p className="mb-2 text-[13px] font-medium text-ink">{D('marginAtMarket')}</p>
                  <KeyValue
                    items={[
                      { label: D('atLowest'), value: <Pct value={marginAt(m.min, cost).margin} /> },
                      { label: D('atAverage'), value: <Pct value={marginAt(m.avg ?? m.min, cost).margin} /> },
                      { label: D('atHighest'), value: <Pct value={marginAt(m.max ?? m.min, cost).margin} /> },
                    ]}
                  />
                </div>
              )}
            </>
          )}
        </Card>

        <Card title={D('pricing')} description={D('pricingDesc')}>
          <Input
            label={D('looksPrice')}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={draftPrice}
            onChange={(e) => setDraftPrice(e.target.value)}
            disabled={decided}
            dir="ltr"
          />
          {!decided && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {m.min !== null && (
                <Button size="xs" variant="outline" onClick={() => setDraftPrice(String(m.min))}>
                  {D('matchLowest')}
                </Button>
              )}
              {m.avg !== null && (
                <Button size="xs" variant="outline" onClick={() => setDraftPrice(String(m.avg))}>
                  {D('matchAverage')}
                </Button>
              )}
              {[0.35, 0.5].map((g) => {
                const p = priceAt(g)
                return p ? (
                  <Button key={g} size="xs" variant="outline" onClick={() => setDraftPrice(String(p))}>
                    {D('targetMargin', { pct: g * 100 })}
                  </Button>
                ) : null
              })}
            </div>
          )}
          {calc && (
            <KeyValue
              className="mt-4"
              items={[
                { label: D('exVat'), value: <Money value={calc.ex} /> },
                { label: `${D('netCost')} (${t('sourcing.vatExcl')})`, value: <Money value={cost!} /> },
                { label: D('profit'), value: <Money value={calc.profit} className={calc.profit < 0 ? 'text-error' : 'text-success'} /> },
                { label: D('margin'), value: <Pct value={calc.margin} /> },
                { label: D('vsAvg'), value: m.avg ? <span dir="ltr">{`${draft >= m.avg ? '+' : ''}${(((draft - m.avg) / m.avg) * 100).toFixed(1)}%`}</span> : '—' },
                { label: D('vsLowest'), value: m.min ? <span dir="ltr">{`${draft >= m.min ? '+' : ''}${(((draft - m.min) / m.min) * 100).toFixed(1)}%`}</span> : '—' },
              ]}
            />
          )}
          {!decided && (
            <Button className="mt-4 w-full" variant="secondary" onClick={savePrice} loading={busy} disabled={String(row.looksPrice ?? '') === draftPrice}>
              {D('savePrice')}
            </Button>
          )}
        </Card>

      </div>

      <div className="mt-6">
        {/* Competitor prices */}
        <Card
          title={D('competitors')}
          description={D('competitorsDesc', { fresh: m.fresh, min: rules.minRetailers })}
          padded={false}
          actions={
            <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setPriceModal({})}>
              {D('addPrice')}
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-[13px]">
              <thead className="border-y border-line-soft bg-mist/60 text-start text-xs text-muted">
                <tr>
                  <th className="px-5 py-2 text-start font-medium">{D('retailer')}</th>
                  <th className="px-3 py-2 text-end font-medium">{D('price')}</th>
                  <th className="px-3 py-2 text-start font-medium">{D('seller')}</th>
                  <th className="px-3 py-2 text-start font-medium">{D('match')}</th>
                  <th className="px-3 py-2 text-start font-medium">{D('verifiedOn')}</th>
                  <th className="px-5 py-2 text-end font-medium">
                    <span className="sr-only">{t('common.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {orderedRetailers.map((r) => {
                  const ps = priceFor(r)
                  if (!ps.length)
                    return (
                      <tr key={r.id} className="bg-surface">
                        <td className="px-5 py-3">
                          <p className="font-medium text-ink">{r.name}</p>
                          <p className="text-[11.5px] text-subtle">{t(`sourcing.collection.${r.collection}`)}</p>
                        </td>
                        <td colSpan={4} className="px-3 py-3">
                          <p className="text-muted">{D('notVerified')}</p>
                          <p className="text-[11.5px] text-subtle">{r.collection === 'manual' ? (lang === 'ar' ? (r.noteAr ?? r.note) : r.note) : D('notFoundAuto')}</p>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <a href={searchLink(r, row)} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-md border border-line px-2 text-xs font-medium text-ink hover:bg-mist">
                              <Search className="size-3.5" aria-hidden />
                              {D('searchStore')}
                            </a>
                            <Button size="xs" variant="outline" icon={<Plus className="size-3.5" />} onClick={() => setPriceModal({ retailerId: r.id })}>
                              {D('addPrice')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  return ps.map((c) => {
                    const fresh = isFresh(c, rules)
                    return (
                      <tr key={c.id} className={cn(!fresh && 'opacity-60')}>
                        <td className="px-5 py-3 align-top">
                          <p className="font-medium text-ink">{r.name}</p>
                          <Badge tone={c.source === 'manual' ? 'champagne' : 'neutral'} className="mt-1">
                            {t(`sourcing.source.${c.source}`)}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-end align-top">
                          <Money value={c.price} className="font-semibold" />
                          {c.originalPrice && <Money value={c.originalPrice} className="block text-[11.5px] text-subtle line-through" />}
                          <p className={cn('text-[11.5px]', c.inStock ? 'text-success' : 'text-error')}>{D(c.inStock ? 'inStock' : 'outOfStock')}</p>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <p className="text-ink">{c.seller}</p>
                          <p className="line-clamp-2 max-w-56 text-[11.5px] text-subtle">{c.listedName}</p>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Badge tone={c.matchBy === 'barcode' ? 'success' : 'info'}>{t(`sourcing.matchBy.${c.matchBy}`)}</Badge>
                        </td>
                        <td className="px-3 py-3 align-top whitespace-nowrap">
                          <p className="text-ink">{formatDate(c.verifiedAt, lang)}</p>
                          <p className="text-[11.5px] text-subtle">{c.verifiedBy}</p>
                          {!fresh && <p className="text-[11.5px] text-warning">{D('stale', { days: rules.maxPriceAgeDays })}</p>}
                        </td>
                        <td className="px-5 py-3 align-top">
                          <div className="flex items-center justify-end gap-1">
                            <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-rose-dark hover:bg-rose-soft">
                              <ExternalLink className="size-3.5" aria-hidden />
                              {D('open')}
                            </a>
                            {c.source === 'manual' && (
                              <>
                                <IconButton label={D('editPrice')} size="sm" onClick={() => setPriceModal({ editing: c })}>
                                  <Pencil />
                                </IconButton>
                                <IconButton label={D('removePrice')} size="sm" onClick={() => setToRemove(c)}>
                                  <Trash2 />
                                </IconButton>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                })}
              </tbody>
            </table>
          </div>
        </Card>

      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="min-w-0 space-y-6">
          {/* Supplier */}
          <Card title={D('supplier')} description={D('supplierDesc')}>
            <div className="space-y-4">
              {row.offers.map((o) => {
                const s = suppliers.find((x) => x.id === o.supplierId)
                return (
                  <div key={`${o.supplierId}-${o.code}`} className="rounded-md border border-line p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{s?.name ?? o.supplierId}</p>
                      {o.costVerified ? (
                        <Badge tone="success" icon={<BadgeCheck />}>
                          {D('verified')}
                        </Badge>
                      ) : (
                        <Button size="xs" icon={<BadgeCheck className="size-3.5" />} onClick={async () => (await verifyCost(row.id, o.supplierId, o.code), toast.success(D('costConfirmed')), reload())}>
                          {D('verifyCost')}
                        </Button>
                      )}
                    </div>
                    <KeyValue
                      items={[
                        { label: D('code'), value: <span dir="ltr">{o.code}</span> },
                        { label: D('nameOnList'), value: <span dir="ltr">{o.nameOnList}</span> },
                        { label: D('listPrice'), value: o.listPrice !== null ? <Money value={o.listPrice} /> : '—' },
                        { label: D('discount'), value: <span dir="ltr">{Math.round(o.discount * 100)}%</span> },
                        { label: `${D('netCost')} (${t('sourcing.vatExcl')})`, value: <Money value={o.netCost} className="font-semibold" /> },
                        { label: D('page'), value: o.sourcePage ?? '—' },
                      ]}
                    />
                    <p className="mt-3 text-xs text-muted">
                      {D('basis')}: {o.priceBasis}
                    </p>
                    {o.costVerified && o.costVerifiedBy && <p className="mt-1 text-xs text-subtle">{D('verifiedBy', { by: o.costVerifiedBy, date: formatDate(o.costVerifiedAt, lang) })}</p>}
                  </div>
                )
              })}
              {row.offers.length > 1 && <p className="text-xs text-muted">{D('lowestCostUsed')}</p>}
            </div>
          </Card>

          <Card title={D('identity')}>
            <div className="mb-4 flex items-center gap-3">
              <BrandTile brand={row.brand} />
              <p className="text-[13px] font-medium text-ink">{name}</p>
            </div>
            <KeyValue
              items={[
                { label: D('looksId'), value: <span dir="ltr">{row.id}</span> },
                { label: D('brand'), value: row.brand },
                { label: D('size'), value: <span dir="ltr">{row.size}</span> },
                { label: D('barcode'), value: <span dir="ltr">{row.barcode || '—'}</span> },
                { label: D('category'), value: lang === 'ar' ? row.categoryAr : row.categoryEn },
              ]}
            />
            {row.nameAr && (
              <p className="mt-3 text-[13px] text-muted" dir="rtl" lang="ar">
                {row.nameAr}
              </p>
            )}
          </Card>
        </div>
        <div className="min-w-0">
          <Card title={D('history')}>
            <Timeline
              items={[...row.history].reverse().map((h) => ({
                title: h.note,
                time: `${formatDateTime(h.at, lang)} · ${h.by}`,
                tone: EVENT_TONE[h.action],
              }))}
            />
          </Card>
        </div>
      </div>

      {priceModal && <PriceFormModal key={priceModal.editing?.id ?? priceModal.retailerId ?? 'new'} open onClose={() => setPriceModal(null)} onSaved={reload} product={row} retailers={retailers} retailerId={priceModal.retailerId} editing={priceModal.editing} />}

      <ConfirmDialog
        open={!!toRemove}
        onClose={() => setToRemove(null)}
        title={D('removePrice')}
        description={toRemove ? `${toRemove.seller} — SAR ${formatNumber(toRemove.price)}` : ''}
        confirmLabel={D('removePrice')}
        onConfirm={async () => {
          if (!toRemove) return
          await removePrice(row.id, toRemove.id)
          toast.success(t('sourcing.priceForm.removed'))
          reload()
        }}
      />

      <Modal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        size="sm"
        title={D('approveTitle', { name })}
        description={row.looksPrice && cost !== null ? D('approveDesc', { price: `SAR ${formatNumber(row.looksPrice)}`, margin: (marginAt(row.looksPrice, cost).margin * 100).toFixed(1) }) : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={busy}>
              {t('common.cancel')}
            </Button>
            <Button
              icon={<CheckCircle2 className="size-4" />}
              loading={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await approveProduct(row.id, note.trim())
                  toast.success(D('approvedToast'))
                  setApproveOpen(false)
                  reload()
                } catch {
                  toast.error(D('blockedTitle'))
                } finally {
                  setBusy(false)
                }
              }}
            >
              {D('approve')}
            </Button>
          </>
        }
      >
        <CheckList checks={row.checks} />
        <Textarea wrapperClassName="mt-4" label={D('approveNote')} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </Modal>

      <ConfirmDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={D('rejectTitle')}
        description={D('rejectDesc')}
        confirmLabel={D('reject')}
        onConfirm={async () => {
          await rejectProduct(row.id, note.trim())
          toast.success(D('rejectedToast'))
          reload()
        }}
      >
        <Textarea label={D('rejectReason')} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </ConfirmDialog>
    </>
  )
}
