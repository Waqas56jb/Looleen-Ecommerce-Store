import { ArrowRight } from 'lucide-react'
import { Img, Money } from '@/components/ui'
import { translate } from '@/i18n'
import type { Lang, Offer } from '@/types'
import { cn, formatDate } from '@/utils'

export type OfferPreviewData = Pick<Offer, 'title' | 'titleAr' | 'description' | 'banner' | 'discountType' | 'discountValue' | 'startDate' | 'endDate'>

/** Storefront-style offer tile. `lang` lets the admin preview either language. */
export function OfferPreview({ data, lang, className }: { data: OfferPreviewData; lang: Lang; className?: string }) {
  const T = (k: string, v?: Record<string, string | number>) => translate(lang, `marketing.${k}`, v)
  const title = (lang === 'ar' ? data.titleAr : data.title) || (lang === 'ar' ? data.title : data.titleAr)
  return (
    <article dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang} className={cn('overflow-hidden rounded-lg border border-line bg-surface shadow-card', className)}>
      <div className="relative aspect-[16/9] overflow-hidden">
        <Img src={data.banner} alt={title || 'Offer banner'} w={900} h={506} className="absolute inset-0 size-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" aria-hidden />
        <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink shadow-card">
          {data.discountType === 'percentage' ? (
            T('shared.percentOff', { value: data.discountValue || 0 })
          ) : (
            <>
              <Money value={data.discountValue || 0} /> {T('shared.off')}
            </>
          )}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className={cn('font-serif text-2xl leading-tight font-semibold', !title && 'opacity-50')}>{title || T('bannerForm.titlePlaceholder')}</h3>
        </div>
      </div>
      <div className="space-y-3 p-4">
        {data.description && <p className="line-clamp-2 text-[13px] text-muted">{data.description}</p>}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-subtle">{data.endDate ? T('offers.ends', { date: formatDate(data.endDate, lang) }) : ''}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-medium text-white">
            {T('offers.shopNow')}
            <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
          </span>
        </div>
      </div>
    </article>
  )
}
