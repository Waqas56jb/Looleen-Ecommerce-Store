import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button, ConfirmDialog, Input, Modal, Select, StatusBadge, Textarea } from '@/components/ui'
import { useT } from '@/i18n'
import { cancelOrder, updateOrderStatus } from '@/services/orderService'
import type { AdminOrder, OrderStatus } from '@/types'
import { nextStatuses } from './orderUtils'
import { useStatusWord } from './useStatusLabel'

interface Props {
  order: AdminOrder | null
  open: boolean
  onClose: () => void
  onDone: () => void
  /** Preselect a status (e.g. from a row "Mark as…" action) */
  initialStatus?: OrderStatus
}

export function UpdateStatusModal({ order, open, onClose, onDone, initialStatus }: Props) {
  const { t } = useT()
  const word = useStatusWord()
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [note, setNote] = useState('')
  const [tracking, setTracking] = useState('')
  const [errors, setErrors] = useState<{ status?: string; note?: string }>({})
  const [busy, setBusy] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  useEffect(() => {
    if (open) {
      setStatus(initialStatus ?? '')
      setNote('')
      setTracking('')
      setErrors({})
    }
  }, [open, initialStatus])

  if (!order) return null
  const options = nextStatuses(order.status)
  const isCancel = status === 'cancelled'

  const run = async () => {
    if (!status) return
    setBusy(true)
    try {
      if (status === 'cancelled') {
        await cancelOrder(order.id, note.trim())
        toast.success(t('orders.toast.cancelled', { number: order.number }))
      } else {
        const trackingNumber = status === 'shipped' ? tracking.trim() : ''
        const parts = [note.trim(), trackingNumber ? t('orders.updateModal.trackingNote', { value: trackingNumber }) : ''].filter(Boolean)
        await updateOrderStatus(order.id, status, parts.join(' · ') || undefined, trackingNumber ? { number: trackingNumber } : undefined)
        toast.success(t('orders.toast.marked', { number: order.number, status: word(status) }))
      }
      onClose()
      onDone()
    } catch {
      toast.error(t('orders.toast.error'))
    } finally {
      setBusy(false)
    }
  }

  const submit = () => {
    const e: typeof errors = {}
    if (!status) e.status = t('orders.updateModal.statusRequired')
    if (isCancel && !note.trim()) e.note = t('orders.updateModal.reasonRequired')
    setErrors(e)
    if (Object.keys(e).length) return
    if (isCancel) setConfirmCancel(true)
    else void run()
  }

  return (
    <>
      <Modal
        open={open && !confirmCancel}
        onClose={busy ? () => undefined : onClose}
        title={t('orders.updateModal.title')}
        description={<span>{t('orders.updateModal.desc', { number: order.number })}</span>}
        footer={
          options.length > 0 ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={busy}>
                {t('common.cancel')}
              </Button>
              <Button onClick={submit} loading={busy} variant={isCancel ? 'danger' : 'primary'}>
                {isCancel ? t('orders.actions.cancel') : t('orders.updateModal.save')}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>
              {t('common.close')}
            </Button>
          )
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-md bg-mist px-3 py-2.5 text-[13px]">
            <span className="text-muted">{t('orders.updateModal.current')}</span>
            <StatusBadge status={order.status} />
          </div>
          {options.length === 0 ? (
            <p className="text-sm text-muted">{t('orders.updateModal.noNext')}</p>
          ) : (
            <>
              <Select
                label={t('orders.updateModal.next')}
                required
                value={status}
                placeholder={t('orders.updateModal.choose')}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                options={options.map((s) => ({ value: s, label: t(`status.${s}`) }))}
                error={errors.status}
                data-autofocus
              />
              {status === 'shipped' && (
                <Input label={t('orders.updateModal.tracking')} value={tracking} onChange={(e) => setTracking(e.target.value)} hint={t('orders.updateModal.trackingHint')} dir="ltr" placeholder={order.trackingNumber ?? '784512903'} />
              )}
              {isCancel && (
                <p className="flex gap-2 rounded-md border border-error/20 bg-error-soft px-3 py-2.5 text-[13px] text-error">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {t('orders.updateModal.cancelWarning')}
                </p>
              )}
              <Textarea
                label={isCancel ? t('orders.updateModal.reason') : t('orders.updateModal.note')}
                required={isCancel}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={isCancel ? t('orders.updateModal.reasonPlaceholder') : t('orders.updateModal.notePlaceholder')}
                error={errors.note}
              />
            </>
          )}
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={run}
        title={t('orders.cancelDialog.title', { number: order.number })}
        description={t('orders.cancelDialog.desc')}
        confirmLabel={t('orders.cancelDialog.confirm')}
        cancelLabel={t('orders.cancelDialog.keep')}
      />
    </>
  )
}
