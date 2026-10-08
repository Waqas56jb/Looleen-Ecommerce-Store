import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button, Input, Modal, RatingInput, Textarea } from '@/components/common'
import { useT } from '@/i18n'
import { submitReview } from '@/services/reviewService'
import { useAuthStore } from '@/store/auth'
import type { Product, Review } from '@/types'

interface ReviewFormProps {
  product: Product
  open: boolean
  onClose: () => void
  onSubmitted: (review: Review) => void
}

type Errors = Partial<Record<'rating' | 'title' | 'comment', string>>

export function ReviewForm({ product, open, onClose, onSubmitted }: ReviewFormProps) {
  const { t } = useT()
  const user = useAuthStore((s) => s.user)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = (): Errors => {
    const e: Errors = {}
    if (!rating) e.rating = t('product.form.ratingError')
    if (title.trim().length < 3) e.title = t('product.form.headlineError')
    if (comment.trim().length < 20) e.comment = t('product.form.commentError')
    return e
  }

  const reset = () => {
    setRating(0)
    setTitle('')
    setComment('')
    setErrors({})
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    setSubmitting(true)
    try {
      const review = await submitReview({ productId: product.id, rating, title: title.trim(), comment: comment.trim() })
      toast.success(t('toast.reviewSubmitted'))
      onSubmitted(review)
      reset()
      onClose()
    } catch {
      toast.error(t('common.somethingWrong'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('product.form.title')} size="md">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <p className="eyebrow text-muted">{product.brandName}</p>
          <p className="mt-1 font-serif text-lg leading-snug">{product.name}</p>
          <p className="mt-2 text-sm text-muted">{t('product.form.intro')}</p>
        </div>

        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-ink">{t('product.form.rating')}</legend>
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

        <Input
          label={t('product.form.headline')}
          placeholder={t('product.form.headlinePlaceholder')}
          value={title}
          maxLength={80}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
        />

        <Textarea
          label={t('product.form.comment')}
          placeholder={t('product.form.commentPlaceholder')}
          value={comment}
          rows={5}
          maxLength={1000}
          onChange={(e) => setComment(e.target.value)}
          error={errors.comment}
          hint={t('product.form.commentHint', { count: comment.trim().length })}
        />

        {!user && <p className="text-xs text-muted">{t('product.form.guestNote')}</p>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={submitting}>
            {t('product.form.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
