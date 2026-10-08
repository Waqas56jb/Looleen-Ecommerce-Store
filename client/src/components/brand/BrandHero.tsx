import { BadgeCheck, MapPin, ShieldCheck } from 'lucide-react'
import { Breadcrumbs, SmartImage } from '@/components/common'
import { useT } from '@/i18n'
import type { BrandWithCount } from '@/services/catalogService'

/** Brand banner: image + ink overlay, serif name, origin and authorized-distributor note */
export function BrandHero({ brand, countLabel }: { brand: BrandWithCount; countLabel: (n: number) => string }) {
  const { t, l, lang } = useT()
  return (
    <header>
      <div className="relative isolate overflow-hidden bg-ink text-ivory">
        <SmartImage src={brand.image} alt="" width={1800} height={760} priority wrapperClassName="absolute inset-0 -z-10 bg-ink" className="opacity-90" />
        <span className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/65 to-ink/30" aria-hidden />
        <div className="container-x flex min-h-[320px] flex-col justify-end py-10 sm:min-h-[400px] sm:py-14 lg:min-h-[460px]">
          <Breadcrumbs items={[{ label: t('nav.brands'), to: '/brands' }, { label: brand.name }]} className="text-ivory/70 [&_a:hover]:text-ivory [&_span]:text-ivory" />
          <p className="eyebrow mt-8 text-champagne">{brand.professional ? t('catalog.brand.professional') : t('catalog.brand.eyebrow')}</p>
          <h1 className="heading-hero mt-3 text-balance">{brand.name}</h1>
          {lang === 'ar' && <p className="mt-2 text-lg text-ivory/80">{brand.nameAr}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ivory/80">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden />
              {t('catalog.brand.origin', { country: brand.country })}
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="size-4 text-champagne" aria-hidden />
              {t('common.authorized')}
            </span>
            <span>{countLabel(brand.productCount)}</span>
          </div>
        </div>
      </div>

      <div className="container-x grid grid-cols-1 gap-6 py-10 sm:py-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
        <p className="font-serif text-2xl leading-snug text-ink sm:text-[28px]">{l(brand.description)}</p>
        <div className="flex gap-4 rounded-xs border border-champagne/40 bg-champagne-soft/40 p-5">
          <ShieldCheck className="mt-0.5 size-6 shrink-0 text-success" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-ink">{t('catalog.brand.official', { brand: brand.name })}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{t('catalog.brand.officialDesc')}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
