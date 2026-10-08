import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog, Money, Textarea } from '@/components/ui'
import { useT } from '@/i18n'
import { approveReturn, rejectReturn, updateReturnStatus } from '@/services/moderationService'
import type { ReturnRequest, ReturnStatus } from '@/types'
import { formatPrice } from '@/utils'

export type ReturnAction = Exclude<ReturnStatus, 'requested'>

/** The single next step available for a return in each state */
export function nextReturnActions(status: ReturnStatus): ReturnAction[] {
  switch (status) {
    case 'requested':
      return ['approved', 'rejected']
    case 'approved':
      return ['pickup_scheduled']
    case 'pickup_scheduled':
      return ['received']
    case 'received':
      return ['refunded']
    default:
      return []
  }
}

export const ACTION_LABEL: Record<ReturnAction, string> = {
  approved: 'orders.returns.actions.approve',
  rejected: 'orders.returns.actions.reject',
  pickup_scheduled: 'orders.returns.actions.schedule',
  received: 'orders.returns.actions.receive',
  refunded: 'orders.returns.actions.refund',
}

const COPY: Record<ReturnAction, { title: string; desc: string }> = {
  approved: { title: 'approveTitle', desc: 'approveDesc' },
  rejected: { title: 'rejectTitle', desc: 'rejectDesc' },
  pickup_scheduled: { title: 'scheduleTitle', desc: 'scheduleDesc' },
  received: { title: 'receiveTitle', desc: 'receiveDesc' },
  refunded: { title: 'refundTitle', desc: 'refundDesc' },
}

export function ReturnActionDialog({ ret, action, onClose, onDone }: { ret: ReturnRequest; action: ReturnAction | null; onClose: () => void; onDone: () => void }) {
  const { t, lang } = useT()
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    setNote('')
    setError('')
  }, [action])

  const a = action ?? 'approved'
  const isReject = a === 'rejected'
  const vars = { number: ret.number, amount: formatPrice(ret.amount, lang), customer: ret.customerName }
  // ConfirmDialog closes after onConfirm resolves; this keeps it open when validation fails
  const keepOpen = useRef(false)
  const handleClose = () => {
    if (keepOpen.current) {
      keepOpen.current = false
      return
    }
    onClose()
  }

  const confirm = async () => {
    if (isReject && !note.trim()) {
      setError(t('orders.returns.dialogs.reasonRequired'))
      keepOpen.current = true
      return
    }
    try {
      const n = note.trim() || undefined
      if (a === 'approved') await approveReturn(ret.id, n)
      else if (a === 'rejected') await rejectReturn(ret.id, n)
      else await updateReturnStatus(ret.id, a, n)
      toast.success(t(`orders.returns.toast.${a}`, { number: ret.number }))
      onDone()
    } catch {
      toast.error(t('orders.toast.error'))
    }
  }

  return (
    <ConfirmDialog
      open={!!action}
      onClose={handleClose}
      onConfirm={confirm}
      tone={isReject || a === 'refunded' ? 'danger' : 'default'}
      title={t(`orders.returns.dialogs.${COPY[a].title}`, vars)}
      description={t(`orders.returns.dialogs.${COPY[a].desc}`, vars)}
      confirmLabel={t(ACTION_LABEL[a])}
    >
      {a === 'refunded' && (
        <div className="mb-3 flex items-baseline justify-between rounded-md bg-mist px-3 py-2.5 text-[13px]">
          <span className="text-muted">{t('orders.returns.detail.amount')}</span>
          <Money value={ret.amount} className="text-base font-semibold text-ink" />
        </div>
      )}
      <Textarea
        label={isReject ? t('orders.returns.dialogs.reason') : t('orders.returns.dialogs.note')}
        required={isReject}
        rows={3}
        value={note}
        onChange={(e) => {
          setNote(e.target.value)
          setError('')
        }}
        placeholder={isReject ? t('orders.returns.dialogs.reasonPlaceholder') : t('orders.returns.dialogs.notePlaceholder')}
        error={error}
      />
    </ConfirmDialog>
  )
}
