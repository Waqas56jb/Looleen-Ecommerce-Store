import { BadgeCheck, ShieldCheck } from 'lucide-react'
import { BrandSkeleton, ErrorState, Reveal, SmartImage, Skeleton } from '@/components/common'
import { BrandDirectory, FeaturedBrandCard } from '@/components/brand'
import { EDITORIAL } from '@/data/images'
import { useAsync, useDocumentMeta } from '@/hooks'
import { useT } from '@/i18n'
import { getBrands, getFeaturedBrands } from '@/services/catalogService'

export default function BrandsPage() {
  const { t } = useT()
  const all = useAsync(() => getBrands(), [])
  const featured = useAsync(() => getFeaturedBrands(), [])
  useDocumentMeta(t('catalog.brands.title'), t('catalog.brands.subtitle'))

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ink text-ivory">
        <SmartImage src={EDITORIAL.brands} alt="" width={1800} height={700} priority wrapperClassName="absolute inset-0 -z-10 bg-ink" className="opacity-60" />
        <span className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/70 to-ink/20 rtl:bg-gradient-to-l" aria-hidden />
        <div className="container-x py-16 sm:py-24 lg:py-28">
          <p className="eyebrow text-champagne">{t('catalog.brands.eyebrow')}</p>
          <h1 className="heading-hero mt-4 max-w-3xl text-balance">{t('catalog.brands.title')}</h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ivory/75 sm:text-lg">{t('catalog.brands.subtitle')}</p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[13px] text-ivory/85">
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-champagne" aria-hidden />
              {t('trust.original')}
            </span>
            <span className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-champagne" aria-hidden />
              {t('trust.authorizedDesc')}
            </span>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section aria-labelledby="featured-brands" className="container-x py-16 sm:py-20">
        <div className="mb-8 flex flex-col gap-2 sm:mb-10">
          <h2 id="featured-brands" className="heading-section">
            {t('catalog.brands.featured')}
          </h2>
          <p className="text-[15px] text-muted">{t('catalog.brands.featuredDesc')}</p>
        </div>
        {featured.error ? (
          <ErrorState onRetry={featured.reload} />
        ) : !featured.data ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4" aria-hidden>
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="aspect-[4/5]" />
            ))}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {featured.data.slice(0, 12).map((b, i) => (
              <Reveal as="li" key={b.id} delay={(i % 4) * 60}>
                <FeaturedBrandCard brand={b} priority={i < 4} />
              </Reveal>
            ))}
          </ul>
        )}
      </section>

      {/* All brands */}
      {all.error ? (
        <ErrorState onRetry={all.reload} />
      ) : !all.data ? (
        <div className="container-x pb-20">
          <Skeleton className="mb-8 h-10 w-64" />
          <BrandSkeleton />
        </div>
      ) : (
        <BrandDirectory brands={all.data} />
      )}
    </div>
  )
}
