import { useEffect, useMemo, useState } from 'react'
import { ErrorState, Skeleton } from '@/components/common'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getReviews, summarize } from '@/services/reviewService'
import type { Product, Review } from '@/types'
import { ReviewForm } from './ReviewForm'
import { ReviewList } from './ReviewList'
import { ReviewSummary } from './ReviewSummary'

/** Full reviews block for the product page (anchor: #reviews) */
export function ReviewsSection({ product }: { product: Product }) {
  const { t } = useT()
  const { data, loading, error, reload } = useAsync(() => getReviews(product.id), [product.id])
  const [list, setList] = useState<Review[]>([])
  const [added, setAdded] = useState(0)
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    setList(data ?? [])
    setAdded(0)
  }, [data])

  const summary = useMemo(
    // Seed reviews are a sample — scale their distribution to the published count
    () => summarize(list, product.reviewCount ? { rating: product.rating, count: product.reviewCount + added } : undefined),
    [list, product.rating, product.reviewCount, added],
  )

  const onSubmitted = (review: Review) => {
    setList((l) => [review, ...l])
    setAdded((n) => n + 1)
  }

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-28">
      <p className="eyebrow mb-3">{t('product.reviews.eyebrow')}</p>
      <h2 id="reviews-heading" className="heading-section">
        {t('product.reviews.title')}
      </h2>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-16">
        {error ? (
          <ErrorState onRetry={reload} className="lg:col-span-2" />
        ) : loading && !data ? (
          <>
            <Skeleton className="h-96 w-full" />
            <div className="space-y-6">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="lg:sticky lg:top-28 lg:self-start">
              <ReviewSummary summary={summary} onWrite={() => setFormOpen(true)} />
            </div>
            <ReviewList reviews={list} onWrite={() => setFormOpen(true)} />
          </>
        )}
      </div>

      <ReviewForm product={product} open={formOpen} onClose={() => setFormOpen(false)} onSubmitted={onSubmitted} />
    </section>
  )
}
