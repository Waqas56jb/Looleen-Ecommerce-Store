import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button, Input, Modal, RatingInput, SmartImage, Textarea } from '@/components/common'
import { useT } from '@/i18n'
import { submitReview } from '@/services/reviewService'
import type { OrderItem } from '@/types'

export function WriteReviewModal({ item, onClose }: { item: OrderItem | null; onClose: () => void }) {
  const { t } = useT()
  return (
    <Modal open={!!item} onClose={onClose} title={t('account.reviews.modalTitle')}>
      {item && <ReviewForm key={item.productId} item={item} onDone={onClose} />}
    </Modal>
  )
}

function ReviewForm({ item, onDone }: { item: OrderItem; onDone: () => void }) {
  const { t } = useT()
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState<{ rating?: string; title?: string; comment?: string }>({})
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!rating) next.rating = t('account.reviews.ratingRequired')
    if (!title.trim()) next.title = t('common.required')
    if (comment.trim().length < 20) next.comment = t('account.reviews.commentMin')
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    await submitReview({ productId: item.productId, rating, title: title.trim(), comment: comment.trim() })
    setLoading(false)
    toast.success(t('toast.reviewSubmitted'))
    onDone()
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-4 rounded-xs border border-line bg-white p-3">
        <SmartImage src={item.image} alt={item.name} width={120} height={150} wrapperClassName="aspect-[4/5] w-14 shrink-0 rounded-xs" />
        <div className="min-w-0">
          <p className="eyebrow text-muted">{item.brandName}</p>
          <p className="mt-1 truncate text-sm font-medium">{item.name}</p>
        </div>
      </div>
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink">{t('account.reviews.yourRating')}</legend>
        <RatingInput
          value={rating}
          onChange={(v) => {
            setRating(v)
            setErrors((e) => ({ ...e, rating: undefined }))
          }}
        />
        {errors.rating && (
          <p role="alert" className="mt-1.5 text-xs text-error">
            {errors.rating}
          </p>
        )}
      </fieldset>
      <Input label={t('account.reviews.reviewTitle')} placeholder={t('account.reviews.reviewTitlePh')} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} error={errors.title} />
      <Textarea label={t('account.reviews.comment')} placeholder={t('account.reviews.commentPh')} value={comment} maxLength={1000} rows={5} onChange={(e) => setComment(e.target.value)} error={errors.comment} />
      <Button type="submit" variant="dark" size="lg" fullWidth loading={loading}>
        {t('account.reviews.submit')}
      </Button>
    </form>
  )
}
