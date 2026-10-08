import { useMemo, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { Button, EmptyState, Select } from '@/components/common'
import { useT } from '@/i18n'
import type { Review } from '@/types'
import { ReviewCard } from './ReviewCard'

export type ReviewSort = 'recent' | 'highest' | 'lowest'

const PAGE_SIZE = 4

function sortReviews(list: Review[], sort: ReviewSort): Review[] {
  const out = [...list]
  if (sort === 'highest') return out.sort((a, b) => b.rating - a.rating || b.date.localeCompare(a.date))
  if (sort === 'lowest') return out.sort((a, b) => a.rating - b.rating || b.date.localeCompare(a.date))
  return out.sort((a, b) => b.date.localeCompare(a.date))
}

/** Sortable review list with "Load more" */
export function ReviewList({ reviews, onWrite }: { reviews: Review[]; onWrite: () => void }) {
  const { t } = useT()
  const [sort, setSort] = useState<ReviewSort>('recent')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const sorted = useMemo(() => sortReviews(reviews, sort), [reviews, sort])
  const shown = sorted.slice(0, visible)

  if (!reviews.length) {
    return (
      <EmptyState
        compact
        icon={<MessageSquareText />}
        title={t('product.reviews.emptyTitle')}
        description={t('product.reviews.emptyDesc')}
        action={{ label: t('product.reviews.write'), onClick: onWrite }}
      />
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <p className="text-sm text-muted">{t('product.reviews.showing', { shown: shown.length, total: sorted.length })}</p>
        <Select
          aria-label={t('product.reviews.sortLabel')}
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as ReviewSort)
            setVisible(PAGE_SIZE)
          }}
          wrapperClassName="w-48"
          className="h-10 rounded-full text-sm"
          options={[
            { value: 'recent', label: t('product.reviews.recent') },
            { value: 'highest', label: t('product.reviews.highest') },
            { value: 'lowest', label: t('product.reviews.lowest') },
          ]}
        />
      </div>
      <div aria-live="polite">
        {shown.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
      {visible < sorted.length && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            {t('common.loadMore')}
          </Button>
        </div>
      )}
    </div>
  )
}
