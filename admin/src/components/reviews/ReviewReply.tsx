import { useState } from 'react'
import { Pencil, Send, Store } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, Textarea } from '@/components/ui'
import { useT } from '@/i18n'
import { replyToReview } from '@/services/moderationService'
import type { AdminReview } from '@/types'
import { formatDateTime } from '@/utils'

const MAX = 1000

/** Remount with `key` when the saved reply changes. */
export function ReviewReply({ review, onSaved }: { review: AdminReview; onSaved: () => void }) {
  const { t, lang } = useT()
  const [editing, setEditing] = useState(!review.reply)
  const [text, setText] = useState(review.reply?.text ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!text.trim()) {
      setError(t('customers.reviews.detail.replyRequired'))
      return
    }
    setSaving(true)
    try {
      await replyToReview(review.id, text.trim())
      toast.success(t('customers.reviews.toast.replySaved'))
      onSaved()
    } catch {
      toast.error(t('customers.reviews.toast.failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      title={t('customers.reviews.detail.reply')}
      description={t('customers.reviews.detail.replyDesc')}
      actions={
        review.reply && !editing ? (
          <Button variant="outline" size="sm" icon={<Pencil className="size-3.5" />} onClick={() => setEditing(true)}>
            {t('customers.reviews.detail.editReply')}
          </Button>
        ) : undefined
      }
    >
      {review.reply && !editing && (
        <div className="flex gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-white" aria-hidden>
            <Store className="size-4" />
          </span>
          <div className="min-w-0 flex-1 rounded-lg rounded-ss-sm border border-line-soft bg-mist px-4 py-3">
            <p className="text-[13px] leading-relaxed whitespace-pre-line text-ink">{review.reply.text}</p>
            <p className="mt-2 text-[11.5px] text-subtle">{t('customers.reviews.detail.repliedBy', { name: review.reply.by, date: formatDateTime(review.reply.date, lang) })}</p>
          </div>
        </div>
      )}
      {editing && (
        <div className="flex flex-col gap-3">
          <Textarea
            label={<span className="sr-only">{t('customers.reviews.detail.reply')}</span>}
            value={text}
            rows={4}
            maxLength={MAX}
            onChange={(e) => {
              setText(e.target.value)
              if (error) setError('')
            }}
            placeholder={t('customers.reviews.detail.replyPlaceholder')}
            error={error}
            aside={`${text.length}/${MAX}`}
          />
          <div className="flex flex-wrap justify-end gap-2">
            {review.reply && (
              <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                {t('common.cancel')}
              </Button>
            )}
            <Button icon={<Send className="size-4 rtl:-scale-x-100" />} onClick={save} loading={saving}>
              {review.reply ? t('customers.reviews.detail.updateReply') : t('customers.reviews.detail.publishReply')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
