import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button, ConfirmDialog, Input, Modal, RadioGroup, Textarea } from '@/components/ui'
import { useT } from '@/i18n'
import { refundOrder } from '@/services/orderService'
import type { AdminOrder } from '@/types'
import { formatPrice, paymentName } from '@/utils'

export function RefundModal({ order, open, onClose, onDone }: { order: AdminOrder; open: boolean; onClose: () => void; onDone: () => void }) {
  const { t, lang } = useT()
  const [type, setType] = useState<'full' | 'partial'>('full')
  const [amount, setAmount] = useState(String(order.total))
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<{ amount?: string; reason?: string }>({})
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (open) {
      setType('full')
      setAmount(String(order.total))
      setReason('')
      setErrors({})
    }
  }, [open, order.total])

  const value = type === 'full' ? order.total : Number(amount)
  const method = paymentName(order.paymentMethod, lang)

  const review = () => {
    const e: typeof errors = {}
    if (!(value > 0) || value > order.total) e.amount = t('orders.refundModal.invalidAmount')
    if (!reason.trim()) e.reason = t('orders.refundModal.reasonRequired')
    setErrors(e)
    if (!Object.keys(e).length) setConfirm(true)
  }

  const run = async () => {
    try {
      await refundOrder(order.id, value, reason.trim())
      toast.success(t('orders.toast.refunded', { amount: formatPrice(value, lang), number: order.number }))
      onClose()
      onDone()
    } catch {
      toast.error(t('orders.toast.error'))
    }
  }

  return (
    <>
      <Modal
        open={open && !confirm}
        onClose={onClose}
        title={t('orders.refundModal.title')}
        description={t('orders.refundModal.desc', { number: order.number, amount: formatPrice(order.total, lang), method })}
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={review}>
              {t('orders.refundModal.submit')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <RadioGroup
            name="refund-type"
            label={t('orders.refundModal.type')}
            variant="card"
            value={type}
            onChange={(v) => {
              setType(v)
              if (v === 'full') setAmount(String(order.total))
            }}
            options={[
              { value: 'full', label: t('orders.refundModal.full'), description: t('orders.refundModal.fullDesc') },
              { value: 'partial', label: t('orders.refundModal.partial'), description: t('orders.refundModal.partialDesc') },
            ]}
          />
          <Input
            label={t('orders.refundModal.amount')}
            type="number"
            inputMode="decimal"
            min={0}
            max={order.total}
            step="0.01"
            required
            dir="ltr"
            disabled={type === 'full'}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            hint={t('orders.refundModal.amountHint', { max: formatPrice(order.total, lang) })}
            error={errors.amount}
          />
          <Textarea label={t('orders.refundModal.reason')} required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('orders.refundModal.reasonPlaceholder')} error={errors.reason} />
        </div>
      </Modal>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={run}
        title={t('orders.refundModal.confirmTitle')}
        description={t('orders.refundModal.confirmDesc', { amount: formatPrice(value || 0, lang), customer: order.customerName, method })}
        confirmLabel={t('orders.refundModal.confirm')}
      />
    </>
  )
}
