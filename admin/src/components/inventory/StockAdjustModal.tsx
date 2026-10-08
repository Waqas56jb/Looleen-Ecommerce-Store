import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, ArrowRight, Minus, PackagePlus, Plus, RotateCcw, ShoppingBag, Wrench, XOctagon } from 'lucide-react'
import { Button, Input, Modal, Segmented, StatusBadge, Textarea, Thumb } from '@/components/ui'
import { useT } from '@/i18n'
import { adjustStock, type InventoryRow } from '@/services/inventoryService'
import type { StockMovementType } from '@/types'
import { cn, formatNumber } from '@/utils'

export type AdjustKind = 'received' | 'damaged' | 'correction' | 'return' | 'sale'

const KINDS: { kind: AdjustKind; type: StockMovementType; direction: 'in' | 'out' | 'both'; icon: typeof Plus }[] = [
  { kind: 'received', type: 'purchase', direction: 'in', icon: PackagePlus },
  { kind: 'damaged', type: 'damage', direction: 'out', icon: XOctagon },
  { kind: 'correction', type: 'adjustment', direction: 'both', icon: Wrench },
  { kind: 'return', type: 'return', direction: 'in', icon: RotateCcw },
  { kind: 'sale', type: 'sale', direction: 'out', icon: ShoppingBag },
]

/** Minimal item shape so both the inventory list and detail can open it */
export type AdjustTarget = Pick<InventoryRow, 'productId' | 'name' | 'sku' | 'image' | 'stock' | 'threshold'>

interface Props {
  item: AdjustTarget | null
  onClose: () => void
  onSaved: (row: InventoryRow) => void
}

export function StockAdjustModal({ item, onClose, onSaved }: Props) {
  const { t, isRTL } = useT()
  const [kind, setKind] = useState<AdjustKind>('received')
  const [dir, setDir] = useState<'in' | 'out'>('in')
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<{ qty?: string; reason?: string }>({})
  const [saving, setSaving] = useState(false)

  // reset each time it opens
  useEffect(() => {
    if (!item) return
    setKind('received')
    setDir('in')
    setQty('')
    setReason(t('products.inventory.reasons.received'))
    setReference('')
    setNotes('')
    setErrors({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item])

  const def = KINDS.find((k) => k.kind === kind)!
  const direction: 'in' | 'out' = def.direction === 'both' ? dir : def.direction
  const q = Math.floor(Number(qty))
  const valid = Number.isFinite(q) && q > 0
  const current = item?.stock ?? 0
  const next = valid ? Math.max(0, current + (direction === 'in' ? q : -q)) : current
  const threshold = item?.threshold ?? 0

  const pick = (k: AdjustKind) => {
    const prevDefault = t(`products.inventory.reasons.${kind}`)
    setKind(k)
    if (!reason.trim() || reason === prevDefault) setReason(t(`products.inventory.reasons.${k}`))
    if (k === 'correction') setDir('in')
  }

  const save = async () => {
    if (!item) return
    const e: typeof errors = {}
    if (!valid) e.qty = t('products.inventory.modal.quantityError')
    if (!reason.trim()) e.reason = t('products.inventory.modal.reasonRequired')
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    try {
      const row = await adjustStock({ productId: item.productId, type: def.type, quantity: q, direction, reason: reason.trim(), reference: reference.trim() || undefined, notes: notes.trim() || undefined })
      toast.success(t('products.inventory.modal.success', { name: item.name, from: current, to: row.stock }))
      onSaved(row)
      onClose()
    } catch {
      toast.error(t('products.toast.failed'))
    } finally {
      setSaving(false)
    }
  }

  const nextStatus = next <= 0 ? 'out_of_stock' : next <= threshold ? 'low_stock' : 'in_stock'

  return (
    <Modal
      open={!!item}
      onClose={saving ? () => undefined : onClose}
      size="lg"
      title={t('products.inventory.modal.title')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={save} loading={saving}>
            {t('products.inventory.modal.save')}
          </Button>
        </>
      }
    >
      {item && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-md border border-line-soft bg-mist/60 p-3">
            <Thumb src={item.image} alt={item.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">{item.name}</p>
              <p className="font-mono text-xs text-muted" dir="ltr">
                {item.sku}
              </p>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-ink">{t('products.inventory.modal.type')}</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {KINDS.map(({ kind: k, icon: Icon, direction: d }) => (
                <label key={k} className={cn('flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors', kind === k ? 'border-ink bg-mist' : 'border-line hover:border-ink/30')}>
                  <input type="radio" name="adjust-kind" className="sr-only" checked={kind === k} onChange={() => pick(k)} />
                  <span className={cn('grid size-8 shrink-0 place-items-center rounded-md', d === 'out' ? 'bg-error-soft text-error' : d === 'in' ? 'bg-success-soft text-success' : 'bg-info-soft text-info')}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-ink">{t(`products.inventory.modal.types.${k}`)}</span>
                    <span className="block text-xs text-muted">{t(`products.inventory.modal.typeDesc.${k}`)}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {def.direction === 'both' && (
              <div className="space-y-1.5 sm:col-span-2">
                <p className="text-[13px] font-medium text-ink">{t('products.inventory.modal.direction')}</p>
                <Segmented
                  value={dir}
                  onChange={setDir}
                  options={[
                    { value: 'in', label: <span className="inline-flex items-center gap-1"><Plus className="size-3.5" />{t('products.inventory.modal.increase')}</span> },
                    { value: 'out', label: <span className="inline-flex items-center gap-1"><Minus className="size-3.5" />{t('products.inventory.modal.decrease')}</span> },
                  ]}
                />
              </div>
            )}
            <Input
              label={t('products.inventory.modal.quantity')}
              required
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              dir="ltr"
              value={qty}
              data-autofocus
              leading={direction === 'in' ? <Plus /> : <Minus />}
              onChange={(e) => {
                setQty(e.target.value)
                if (errors.qty) setErrors((x) => ({ ...x, qty: undefined }))
              }}
              error={errors.qty}
            />
            <Input label={t('products.inventory.modal.reference')} dir="ltr" value={reference} placeholder={t('products.inventory.modal.referencePlaceholder')} onChange={(e) => setReference(e.target.value)} />
            <Input
              wrapperClassName="sm:col-span-2"
              label={t('products.inventory.modal.reason')}
              required
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (errors.reason) setErrors((x) => ({ ...x, reason: undefined }))
              }}
              error={errors.reason}
            />
            <Textarea wrapperClassName="sm:col-span-2" rows={2} label={t('products.inventory.modal.notes')} placeholder={t('products.inventory.modal.notesPlaceholder')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="rounded-md border border-line bg-surface p-4">
            <p className="eyebrow mb-2">{t('products.inventory.modal.preview')}</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl font-semibold text-muted tabular-nums">{formatNumber(current)}</span>
              <ArrowRight className={cn('size-5 text-subtle', isRTL && '-scale-x-100')} aria-hidden />
              <span className={cn('text-2xl font-semibold tabular-nums', nextStatus === 'out_of_stock' ? 'text-error' : nextStatus === 'low_stock' ? 'text-warning' : 'text-ink')}>{formatNumber(next)}</span>
              {valid && (
                <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium tabular-nums', direction === 'in' ? 'bg-success-soft text-success' : 'bg-error-soft text-error')} dir="ltr">
                  {direction === 'in' ? '+' : '−'}
                  {formatNumber(q)}
                </span>
              )}
              <StatusBadge status={nextStatus} className="ms-auto" />
            </div>
            {valid && direction === 'out' && q > current && <Warning text={t('products.inventory.modal.exceeds')} />}
            {valid && next <= 0 && current > 0 && <Warning text={t('products.inventory.modal.becomesOut')} />}
            {valid && next > 0 && next <= threshold && current > threshold && <Warning text={t('products.inventory.modal.becomesLow', { threshold })} />}
          </div>
        </div>
      )}
    </Modal>
  )
}

function Warning({ text }: { text: string }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs text-warning">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      {text}
    </p>
  )
}
