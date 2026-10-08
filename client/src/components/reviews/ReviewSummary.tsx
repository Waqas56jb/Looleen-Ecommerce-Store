import { PenLine } from 'lucide-react'
import { Button, RatingStars } from '@/components/common'
import { useT } from '@/i18n'
import type { ReviewSummary as Summary } from '@/services/reviewService'

/** Big average score + 5→1 star distribution bars */
export function ReviewSummary({ summary, onWrite }: { summary: Summary; onWrite: () => void }) {
  const { t } = useT()
  const total = Math.max(1, summary.breakdown.reduce((s, n) => s + n, 0))
  const recommend = Math.round(((summary.breakdown[0] + summary.breakdown[1]) / total) * 100)

  return (
    <div className="rounded-xs bg-blush/50 p-6 sm:p-8">
      <div className="flex items-end gap-4">
        <span className="font-serif text-7xl leading-none font-medium tracking-[-0.04em] text-ink tabular-nums">{summary.average.toFixed(1)}</span>
        <div className="pb-1.5">
          <RatingStars rating={summary.average} size={16} />
          <p className="mt-1.5 text-xs text-muted">{t('product.reviews.basedOn', { count: summary.count.toLocaleString('en-US') })}</p>
        </div>
      </div>

      <ul className="mt-7 flex flex-col gap-2.5">
        {summary.breakdown.map((n, i) => {
          const stars = 5 - i
          const pct = Math.round((n / total) * 100)
          return (
            <li key={stars} className="flex items-center gap-3 text-xs">
              <span className="w-12 shrink-0 text-muted">{t('product.reviews.starsLabel', { stars })}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white" role="img" aria-label={`${t('product.reviews.starsLabel', { stars })}: ${pct}%`}>
                <span className="block h-full rounded-full bg-champagne transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-9 shrink-0 text-end text-muted tabular-nums">{pct}%</span>
            </li>
          )
        })}
      </ul>

      <p className="mt-6 text-sm text-ink">{t('product.reviews.recommend', { percent: recommend })}</p>

      <Button variant="dark" fullWidth className="mt-6" icon={<PenLine className="size-4" aria-hidden />} onClick={onWrite}>
        {t('product.reviews.write')}
      </Button>
    </div>
  )
}
