import { useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertTriangle, Check, ExternalLink, History, PackageSearch, Pencil, SlidersHorizontal, X } from 'lucide-react'
import { StockAdjustModal } from '@/components/inventory/StockAdjustModal'
import { StockLevelChart } from '@/components/inventory/StockLevelChart'
import { Badge, Button, ButtonLink, Card, EmptyState, ErrorState, IconButton, PageHeader, PageSkeleton, StatusBadge, Thumb, type Tone, DataTable, type Column } from '@/components/ui'
import { useAsync, useDocumentTitle } from '@/hooks'
import { useT } from '@/i18n'
import { getInventoryItem, getStockMovements, setThreshold } from '@/services/inventoryService'
import type { StockMovement, StockMovementType } from '@/types'
import { cn, formatDateTime, formatNumber } from '@/utils'

const TYPE_TONE: Record<StockMovementType, Tone> = { purchase: 'success', sale: 'info', return: 'champagne', adjustment: 'neutral', damage: 'error' }

function MetricCard({ label, value, hint, hintError, tone, children }: { label: string; value: ReactNode; hint?: string; hintError?: boolean; tone?: 'error' | 'warning'; children?: ReactNode }) {
  return (
    <div className="card flex min-w-0 flex-col gap-1.5 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        {children}
      </div>
      <div className={cn('text-2xl font-semibold tabular-nums', tone === 'error' ? 'text-error' : tone === 'warning' ? 'text-warning' : 'text-ink')}>{value}</div>
      {hint && <p className={cn('text-xs', hintError ? 'text-error' : 'text-subtle')} role={hintError ? 'alert' : undefined}>{hint}</p>}
    </div>
  )
}

export default function InventoryDetailPage() {
  const { id = '' } = useParams()
  const { t, lang } = useT()
  const item = useAsync(() => getInventoryItem(id), [id])
  const moves = useAsync(() => getStockMovements(id), [id])
  const it = item.data
  useDocumentTitle(it ? `${t('products.inventory.title')} · ${it.name}` : t('products.inventory.title'))

  const [adjustOpen, setAdjustOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [savingT, setSavingT] = useState(false)
  const [thresholdError, setThresholdError] = useState('')

  if (item.loading && !it) return <PageSkeleton stats={4} rows={6} />
  if (item.error) return <ErrorState onRetry={item.reload} className="card" />
  if (!it)
    return (
      <div className="card">
        <EmptyState icon={<PackageSearch />} title={t('products.inventory.detail.notFound')} description={t('products.inventory.detail.notFoundDesc')} action={{ label: t('products.inventory.detail.back'), to: '/inventory' }} />
      </div>
    )

  const saveThreshold = async () => {
    const v = Number(draft)
    if (draft.trim() === '' || !Number.isInteger(v) || v < 0) return setThresholdError(t('products.inventory.detail.thresholdInvalid'))
    setSavingT(true)
    try {
      await setThreshold(it.productId, v)
      toast.success(t('products.inventory.detail.thresholdSaved', { value: v }))
      setEditing(false)
      item.reload()
    } catch {
      toast.error(t('products.toast.failed'))
    } finally {
      setSavingT(false)
    }
  }

  const columns: Column<StockMovement>[] = [
    { id: 'date', header: t('products.inventory.detail.date'), mobile: 'subtitle', cell: (m) => <span className="whitespace-nowrap text-muted">{formatDateTime(m.date, lang)}</span> },
    { id: 'type', header: t('products.inventory.detail.type'), mobile: 'title', cell: (m) => <Badge tone={TYPE_TONE[m.type]}>{t(`products.inventory.detail.movementTypes.${m.type}`)}</Badge> },
    {
      id: 'quantity',
      header: t('products.inventory.detail.quantity'),
      align: 'end',
      mobile: 'end',
      cell: (m) => (
        <span dir="ltr" className={cn('font-semibold tabular-nums', m.quantity >= 0 ? 'text-success' : 'text-error')}>
          {m.quantity > 0 ? '+' : m.quantity < 0 ? '−' : ''}
          {formatNumber(Math.abs(m.quantity))}
        </span>
      ),
    },
    { id: 'reference', header: t('products.inventory.detail.reference'), mobile: 'meta', cell: (m) => <span className="font-mono text-xs" dir="ltr">{m.reference || '—'}</span> },
    {
      id: 'reason',
      header: t('products.inventory.detail.reason'),
      mobile: 'meta',
      cell: (m) => (
        <div className="max-w-xs">
          <p className="truncate">{m.reason || '—'}</p>
          {m.notes && <p className="truncate text-xs text-subtle">{m.notes}</p>}
        </div>
      ),
    },
    { id: 'user', header: t('products.inventory.detail.user'), mobile: 'meta', cell: (m) => <span className="whitespace-nowrap">{m.user}</span> },
  ]

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Thumb src={it.image} alt={it.name} size="md" />
            <span className="min-w-0">{it.name}</span>
          </span>
        }
        meta={<StatusBadge status={it.status} />}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-2">
            <span>{it.brandName}</span>
            <span aria-hidden>·</span>
            <span className="font-mono text-xs" dir="ltr">
              {it.sku}
            </span>
          </span>
        }
        breadcrumbs={[{ label: t('nav.catalog') }, { label: t('products.inventory.title'), to: '/inventory' }, { label: it.name }]}
        actions={
          <>
            <ButtonLink to={`/products/${it.productId}`} variant="outline" icon={<ExternalLink className="size-4" />}>
              {t('products.inventory.detail.viewProduct')}
            </ButtonLink>
            <Button icon={<SlidersHorizontal className="size-4" />} onClick={() => setAdjustOpen(true)}>
              {t('products.inventory.adjust')}
            </Button>
          </>
        }
      />

      {it.status !== 'in_stock' && (
        <div role="status" className={cn('mb-6 flex items-start gap-2.5 rounded-lg border px-4 py-3 text-[13px]', it.status === 'out_of_stock' ? 'border-error/20 bg-error-soft text-error' : 'border-warning/20 bg-warning-soft text-warning')}>
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {it.status === 'out_of_stock' ? t('products.inventory.detail.outWarning') : t('products.inventory.detail.lowWarning')}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label={t('products.inventory.detail.current')} value={formatNumber(it.stock)} tone={it.status === 'out_of_stock' ? 'error' : it.status === 'low_stock' ? 'warning' : undefined} />
        <MetricCard label={t('products.inventory.detail.reserved')} value={formatNumber(it.reserved)} hint={t('products.inventory.detail.reservedHint')} />
        <MetricCard label={t('products.inventory.detail.available')} value={formatNumber(it.available)} hint={t('products.inventory.detail.availableHint')} />
        <MetricCard
          label={t('products.inventory.detail.threshold')}
          value={
            editing ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  autoFocus
                  dir="ltr"
                  aria-label={t('products.inventory.detail.threshold')}
                  aria-invalid={!!thresholdError || undefined}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value)
                    setThresholdError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveThreshold()
                    if (e.key === 'Escape') setEditing(false)
                  }}
                  className="h-9 w-24 rounded-md border border-line bg-surface px-2 text-lg font-semibold text-ink outline-none focus:border-ink/40 aria-invalid:border-error"
                />
                <IconButton label={t('common.save')} size="sm" variant="outline" onClick={saveThreshold} disabled={savingT}>
                  <Check />
                </IconButton>
                <IconButton label={t('common.cancel')} size="sm" onClick={() => setEditing(false)} disabled={savingT}>
                  <X />
                </IconButton>
              </div>
            ) : (
              formatNumber(it.threshold)
            )
          }
          hint={thresholdError || undefined}
          hintError={!!thresholdError}
        >
          {!editing && (
            <IconButton
              label={t('products.inventory.detail.editThreshold')}
              size="xs"
              onClick={() => {
                setDraft(String(it.threshold))
                setThresholdError('')
                setEditing(true)
              }}
            >
              <Pencil />
            </IconButton>
          )}
        </MetricCard>
      </div>

      <div className="space-y-6">
        <StockLevelChart movements={moves.data ?? []} currentStock={it.stock} threshold={it.threshold} loading={moves.loading && !moves.data} />

        <Card title={t('products.inventory.detail.history')} description={moves.data ? t('products.inventory.detail.historyDesc', { count: moves.data.length }) : undefined} padded={false}>
          <DataTable
            className="rounded-none border-0 border-t border-line-soft shadow-none"
            columns={columns}
            rows={moves.data}
            rowKey={(m) => m.id}
            loading={moves.loading}
            error={moves.error}
            onRetry={moves.reload}
            empty={<EmptyState icon={<History />} title={t('products.inventory.detail.noMovements')} />}
          />
        </Card>
      </div>

      <StockAdjustModal
        item={adjustOpen ? it : null}
        onClose={() => setAdjustOpen(false)}
        onSaved={() => {
          item.reload()
          moves.reload()
        }}
      />
    </>
  )
}
