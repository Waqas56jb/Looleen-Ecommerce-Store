import { ArrowRight } from 'lucide-react'
import { Img } from '@/components/ui'
import { translate } from '@/i18n'
import type { Banner, Lang } from '@/types'
import { cn } from '@/utils'

export type BannerPreviewData = Pick<Banner, 'title' | 'titleAr' | 'subtitle' | 'subtitleAr' | 'imageDesktop' | 'imageMobile' | 'ctaLabel' | 'ctaLabelAr'>

/**
 * Renders a banner the way the storefront hero does: full-bleed image,
 * dark gradient from the reading side, eyebrow, serif headline, subtitle
 * and a pill CTA. Arabic renders RTL with the Arabic font.
 */
export function BannerPreview({ data, device, lang }: { data: BannerPreviewData; device: 'desktop' | 'mobile'; lang: Lang }) {
  const ar = lang === 'ar'
  const title = (ar ? data.titleAr : data.title) || translate(lang, 'marketing.bannerForm.titlePlaceholder')
  const subtitle = ar ? data.subtitleAr : data.subtitle
  const cta = ar ? data.ctaLabelAr : data.ctaLabel
  const mobile = device === 'mobile'
  const src = mobile ? data.imageMobile || data.imageDesktop : data.imageDesktop

  const banner = (
    <div dir={ar ? 'rtl' : 'ltr'} lang={lang} className={cn('relative isolate overflow-hidden bg-ink text-white', mobile ? 'aspect-[4/5]' : 'aspect-[16/7] rounded-md')}>
      <Img src={src} alt={title} w={mobile ? 540 : 1400} h={mobile ? 675 : 612} className="absolute inset-0 -z-10 size-full" />
      <div
        className={cn('absolute inset-0 -z-10', mobile ? 'bg-gradient-to-t from-ink/85 via-ink/35 to-transparent' : 'bg-gradient-to-r from-ink/80 via-ink/40 to-transparent rtl:bg-gradient-to-l')}
        aria-hidden
      />
      <div className={cn('flex h-full flex-col', mobile ? 'justify-end p-5' : 'justify-center p-[6%] sm:max-w-[62%]')}>
        <p className={cn('font-semibold text-white/75 uppercase', mobile ? 'text-[9px] tracking-[0.2em]' : 'text-[10px] tracking-[0.24em] sm:text-[11px]', ar && 'tracking-normal')}>{translate(lang, 'marketing.bannerForm.eyebrow')}</p>
        <h3 className={cn('mt-2 font-serif leading-[1.05] font-semibold text-balance', mobile ? 'text-[26px]' : 'text-2xl sm:text-3xl xl:text-[40px]', !(ar ? data.titleAr : data.title) && 'opacity-50')}>{title}</h3>
        {subtitle && <p className={cn('mt-2 text-white/85', mobile ? 'line-clamp-3 text-xs' : 'line-clamp-2 text-xs sm:text-sm')}>{subtitle}</p>}
        {cta && (
          <span className={cn('mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white font-medium text-ink shadow-card', mobile ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-xs sm:text-[13px]')}>
            {cta}
            <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
          </span>
        )}
      </div>
    </div>
  )

  if (!mobile) return <div className="rounded-lg border border-line bg-mist p-2">{banner}</div>
  return (
    <div className="flex justify-center rounded-lg border border-line bg-mist px-4 py-5">
      <div className="w-[260px] max-w-full overflow-hidden rounded-[28px] border-[6px] border-ink bg-ink shadow-pop">
        <div className="flex h-5 items-center justify-center bg-ink" aria-hidden>
          <span className="h-1.5 w-14 rounded-full bg-white/20" />
        </div>
        {banner}
        <div className="h-4 bg-ink" aria-hidden />
      </div>
    </div>
  )
}
