import { useState } from 'react'
import { Check, EyeOff, MoreHorizontal, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog, Dropdown, IconButton, Tooltip } from '@/components/ui'
import { useT } from '@/i18n'
import { approveReview, deleteReview, hideReview, rejectReview } from '@/services/moderationService'
import type { AdminReview } from '@/types'

/**
 * Approve / reject (confirm) / hide / delete (confirm) for a single review.
 *   const mod = useReviewModeration({ onChanged: reload })
 */
export function useReviewModeration({ onChanged, onDeleted }: { onChanged: () => void; onDeleted?: () => void }) {
  const { t } = useT()
  const [rejecting, setRejecting] = useState<AdminReview | null>(null)
  const [deleting, setDeleting] = useState<AdminReview | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const run = async (r: AdminReview, fn: (id: string) => Promise<unknown>, msg: string) => {
    setBusyId(r.id)
    try {
      await fn(r.id)
      toast.success(msg)
      onChanged()
    } catch {
      toast.error(t('customers.reviews.toast.failed'))
    } finally {
      setBusyId(null)
    }
  }

  const approve = (r: AdminReview) => run(r, approveReview, t('customers.reviews.toast.approved'))
  const hide = (r: AdminReview) => run(r, hideReview, t('customers.reviews.toast.hidden'))

  const dialogs = (
    <>
      <ConfirmDialog
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title={t('customers.reviews.confirm.rejectTitle')}
        description={rejecting ? t('customers.reviews.confirm.rejectDesc', { name: rejecting.customerName }) : undefined}
        confirmLabel={t('customers.reviews.actions.reject')}
        onConfirm={async () => {
          if (rejecting) await run(rejecting, rejectReview, t('customers.reviews.toast.rejected'))
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t('customers.reviews.confirm.deleteTitle')}
        description={deleting ? t('customers.reviews.confirm.deleteDesc', { name: deleting.customerName }) : undefined}
        confirmLabel={t('customers.reviews.actions.delete')}
        onConfirm={async () => {
          if (!deleting) return
          try {
            await deleteReview(deleting.id)
            toast.success(t('customers.reviews.toast.deleted'))
            if (onDeleted) onDeleted()
            else onChanged()
          } catch {
            toast.error(t('customers.reviews.toast.failed'))
          }
        }}
      />
    </>
  )

  return { approve, hide, reject: setRejecting, remove: setDeleting, busyId, dialogs }
}

type Moderation = ReturnType<typeof useReviewModeration>

/** Inline quick actions (approve / reject) + overflow menu (hide / delete). */
export function ReviewRowActions({ review, mod }: { review: AdminReview; mod: Moderation }) {
  const { t } = useT()
  const busy = mod.busyId === review.id
  return (
    <div className="flex items-center justify-end gap-0.5">
      {review.status !== 'approved' && (
        <Tooltip content={t('customers.reviews.actions.approve')}>
          <IconButton label={t('customers.reviews.actions.approve')} size="sm" disabled={busy} onClick={() => mod.approve(review)} className="text-success hover:bg-success-soft">
            <Check />
          </IconButton>
        </Tooltip>
      )}
      {review.status !== 'rejected' && (
        <Tooltip content={t('customers.reviews.actions.reject')}>
          <IconButton label={t('customers.reviews.actions.reject')} size="sm" disabled={busy} onClick={() => mod.reject(review)} className="text-error hover:bg-error-soft">
            <X />
          </IconButton>
        </Tooltip>
      )}
      <Dropdown
        trigger={({ toggle }) => (
          <IconButton label={t('customers.reviews.actions.more')} size="sm" onClick={toggle} disabled={busy}>
            <MoreHorizontal />
          </IconButton>
        )}
        items={[
          { label: t('customers.reviews.actions.hide'), icon: <EyeOff />, onClick: () => mod.hide(review), disabled: review.status === 'hidden' },
          { divider: true, label: '' },
          { label: t('customers.reviews.actions.delete'), icon: <Trash2 />, onClick: () => mod.remove(review), danger: true },
        ]}
      />
    </div>
  )
}
