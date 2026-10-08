import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck, Eye, PackagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button, DataTable, EmptyState, IconButton, Input, Modal, StatusBadge, Textarea, Thumb, type Column } from '@/components/ui'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { adjustStock, getLowStock, type InventoryRow } from '@/services/inventoryService'
import { formatNumber } from '@/utils'
import { TableHeading } from './TableHeading'

/** Critical = out of stock or ≤ 25% of threshold; Low otherwise */
export function stockLevel(row: Pick<InventoryRow, 'stock' | 'threshold'>): 'critical' | 'low' {
  return row.stock === 0 || row.stock <= row.threshold * 0.25 ? 'critical' : 'low'
}

export function LowStockCard({ className, onChanged }: { className?: string; onChanged?: () => void }) {
  const { t } = useT()
  const { data, loading, error, reload } = useAsync(() => getLowStock(6), [])
  const [target, setTarget] = useState<InventoryRow | null>(null)

  const columns: Column<InventoryRow>[] = [
    {
      id: 'product',
      header: t('common.product'),
      mobile: 'title',
      hideable: false,
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Thumb src={r.image} alt={r.name} size="xs" />
          <span className="block max-w-48 truncate font-medium text-ink">{r.name}</span>
        </div>
      ),
    },
    {
      id: 'sku',
      header: t('dashboard.lowStock.sku'),
      mobile: 'subtitle',
      hideable: false,
      // Narrow card: show the SKU column only on very wide screens (it stays in mobile cards)
      className: 'hidden whitespace-nowrap 2xl:table-cell',
      headerClassName: 'hidden 2xl:table-cell',
      cell: (r) => (
        <span dir="ltr" className="font-mono text-xs text-muted">
          {r.sku}
        </span>
      ),
    },
    { id: 'stock', header: t('dashboard.lowStock.stock'), align: 'end', mobile: 'meta', hideable: false, cell: (r) => <span className="font-medium tabular-nums">{formatNumber(r.stock)}</span> },
    { id: 'threshold', header: t('dashboard.lowStock.threshold'), align: 'end', mobile: 'meta', hideable: false, cell: (r) => <span className="text-muted tabular-nums">{formatNumber(r.threshold)}</span> },
    { id: 'status', header: t('common.status'), mobile: 'end', hideable: false, cell: (r) => <StatusBadge status={stockLevel(r)} /> },
    {
      id: 'actions',
      header: <span className="sr-only">{t('common.actions')}</span>,
      align: 'end',
      hideable: false,
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Link to={`/inventory/${r.productId}`} aria-label={`${t('common.view')} ${r.name}`} className="grid size-9 place-items-center rounded-md text-muted hover:bg-mist hover:text-ink md:size-8">
            <Eye className="size-4" />
          </Link>
          <Button size="xs" variant="outline" icon={<PackagePlus className="size-3.5" />} onClick={() => setTarget(r)} className="max-sm:hidden">
            {t('dashboard.lowStock.restock')}
          </Button>
          <IconButton label={t('dashboard.lowStock.restock')} variant="outline" size="sm" onClick={() => setTarget(r)} className="sm:hidden">
            <PackagePlus />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable
        className={className}
        dense
        columns={columns}
        rows={data}
        rowKey={(r) => r.productId}
        loading={loading}
        error={error}
        onRetry={reload}
        toolbar={<TableHeading title={t('dashboard.lowStock.title')} description={t('dashboard.lowStock.description')} to="/inventory?status=low_stock" />}
        empty={<EmptyState icon={<CircleCheck />} title={t('dashboard.lowStock.empty')} description={t('dashboard.lowStock.emptyDesc')} />}
      />
      <RestockModal
        row={target}
        onClose={() => setTarget(null)}
        onDone={() => {
          setTarget(null)
          reload()
          onChanged?.()
        }}
      />
    </>
  )
}

function RestockModal({ row, onClose, onDone }: { row: InventoryRow | null; onClose: () => void; onDone: () => void }) {
  const { t } = useT()
  const [qty, setQty] = useState('')
  const [notes, setNotes] = useState('')
  const [err, setErr] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [lastId, setLastId] = useState<string>()

  // reset the form whenever a different product is opened
  if (row && row.productId !== lastId) {
    setLastId(row.productId)
    setQty(String(Math.max(1, row.threshold * 2 - row.stock)))
    setNotes('')
    setErr(undefined)
  }

  const n = Math.floor(Number(qty))
  const close = () => {
    setLastId(undefined)
    onClose()
  }

  const submit = async () => {
    if (!row) return
    if (!Number.isFinite(n) || n < 1) {
      setErr(t('dashboard.lowStock.quantityError'))
      return
    }
    setSaving(true)
    try {
      await adjustStock({ productId: row.productId, type: 'purchase', quantity: n, direction: 'in', reason: 'Restock from dashboard', notes: notes.trim() || undefined })
      toast.success(t('dashboard.lowStock.success', { qty: formatNumber(n), name: row.name }))
      setLastId(undefined)
      onDone()
    } catch {
      toast.error(t('dashboard.lowStock.failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={!!row}
      onClose={close}
      size="sm"
      title={t('dashboard.lowStock.modalTitle')}
      description={row ? t('dashboard.lowStock.modalDesc', { name: row.name }) : undefined}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} loading={saving} icon={<PackagePlus className="size-4" />}>
            {t('dashboard.lowStock.confirm')}
          </Button>
        </>
      }
    >
      {row && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <div className="flex items-center gap-3 rounded-md border border-line-soft bg-mist/60 p-3">
            <Thumb src={row.image} alt={row.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-ink">{row.name}</p>
              <p className="text-xs text-muted" dir="ltr">
                {row.sku}
              </p>
            </div>
            <div className="text-end">
              <p className="text-[11px] text-muted">{t('dashboard.lowStock.current')}</p>
              <p className="text-sm font-semibold text-ink tabular-nums">
                {formatNumber(row.stock)} / {formatNumber(row.threshold)}
              </p>
            </div>
          </div>
          <Input
            label={t('dashboard.lowStock.quantity')}
            required
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={qty}
            autoFocus
            onChange={(e) => {
              setQty(e.target.value)
              setErr(undefined)
            }}
            error={err}
            hint={Number.isFinite(n) && n > 0 ? t('dashboard.lowStock.quantityHint', { value: formatNumber(row.stock + n) }) : undefined}
          />
          <Textarea label={t('dashboard.lowStock.notes')} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('dashboard.lowStock.notesPlaceholder')} />
          <button type="submit" hidden />
        </form>
      )}
    </Modal>
  )
}
