import { useState } from 'react'
import { BadgeCheck, ThumbsUp } from 'lucide-react'
import { RatingStars } from '@/components/common'
import { SAUDI_CITIES } from '@/config/store'
import { useT } from '@/i18n'
import type { Review } from '@/types'
import { cn, formatDate } from '@/utils'

/** Localizes a seed city name ("Riyadh") when the store knows it */
function useCityName(city: string) {
  const { lang } = useT()
  const match = SAUDI_CITIES.find((c) => c.en.toLowerCase() === city.toLowerCase() || c.ar === city)
  return match ? match[lang] : city
}

export function ReviewCard({ review }: { review: Review }) {
  const { t, lang } = useT()
  const city = useCityName(review.city)
  const [voted, setVoted] = useState(false)
  const helpful = review.helpful + (voted ? 1 : 0)
  const initial = review.author.trim().charAt(0).toUpperCase()

  return (
    <article className="grid grid-cols-1 gap-4 border-b border-line py-8 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-10">
      <header className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush font-serif text-lg text-rose-dark" aria-hidden>
          {initial}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{review.author}</p>
          <p className="text-xs text-muted">
            {city} · <time dateTime={review.date}>{formatDate(review.date, lang)}</time>
          </p>
          {review.verified && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-success">
              <BadgeCheck className="size-3.5" aria-hidden />
              {t('product.reviews.verified')}
            </p>
          )}
        </div>
      </header>
      <div className="min-w-0">
        <RatingStars rating={review.rating} size={13} />
        {review.title && <h3 className="mt-2.5 font-serif text-xl leading-snug font-medium tracking-[-0.01em] text-ink">{review.title}</h3>}
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{review.comment}</p>
        <button
          type="button"
          onClick={() => setVoted((v) => !v)}
          aria-pressed={voted}
          className={cn(
            'mt-4 inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors',
            voted ? 'border-ink bg-ink text-ivory' : 'border-line text-ink hover:border-ink/50',
          )}
        >
          <ThumbsUp className="size-3.5" aria-hidden />
          {t('product.reviews.helpful', { count: helpful })}
        </button>
      </div>
    </article>
  )
}
