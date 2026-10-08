import { Link } from 'react-router-dom'
import { ArrowUpRight, BadgeCheck, Boxes, Scissors, Sparkles } from 'lucide-react'
import { ArrowLink, ButtonLink, ProductCardSkeleton, Reveal, SectionHeading, Skeleton, SmartImage, Money } from '@/components/common'
import { ProductCard } from '@/components/product'
import { CONCERN_LABELS, shopByConcern } from '@/data/categories'
import { EDITORIAL } from '@/data/images'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getNewArrivals, getProfessionalProducts } from '@/services/productService'
import type { Concern, Product } from '@/types'

/* ---------------- New arrivals (split) ---------------- */

export function NewArrivalsSplit() {
  const { t } = useT()
  const { data, loading } = useAsync(() => getNewArrivals(4), [])
  if (!loading && !data?.length) return null
  return (
    <section className="container-x py-16 sm:py-20 lg:py-28" aria-labelledby="home-new">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        <Reveal className="lg:col-span-5">
          <Link to="/new-arrivals" className="group relative block h-full overflow-hidden rounded-xs">
            <SmartImage
              src={EDITORIAL.newArrivals}
              alt={t('home.newArrivals.imageTitle')}
              width={900}
              height={1200}
              wrapperClassName="aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[640px]"
              className="transition-transform duration-[1200ms] ease-out group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" aria-hidden />
            <span className="absolute inset-x-0 bottom-0 p-6 text-ivory sm:p-10">
              <span className="eyebrow block text-champagne">{t('home.newArrivals.eyebrow')}</span>
              <span className="mt-3 block font-serif text-3xl leading-tight font-medium sm:text-[40px]">{t('home.newArrivals.imageTitle')}</span>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium">
                <span className="link-underline">{t('home.newArrivals.cta')}</span>
                <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
              </span>
            </span>
          </Link>
        </Reveal>
        <div className="lg:col-span-7">
          <Reveal>
            <SectionHeading
              eyebrow={t('home.newArrivals.eyebrow')}
              title={<span id="home-new">{t('home.newArrivals.title')}</span>}
              description={t('home.newArrivals.description')}
              action={<ArrowLink to="/new-arrivals">{t('common.viewAll')}</ArrowLink>}
            />
          </Reveal>
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5">
            {loading || !data
              ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
              : data.map((p, i) => (
                  <Reveal key={p.id} delay={i * 80}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------- Shop by concern ---------------- */

const HAIR_CONCERNS: Concern[] = ['hair-loss', 'frizz', 'damage', 'volume']

export function concernHref(concern: Concern) {
  return `/category/${HAIR_CONCERNS.includes(concern) ? 'hair-care' : 'care'}?concern=${concern}`
}

export function ShopByConcern() {
  const { t, l } = useT()
  return (
    <section className="bg-mist py-16 sm:py-20 lg:py-28" aria-labelledby="home-concern">
      <div className="container-x">
        <Reveal>
          <SectionHeading align="center" eyebrow={t('home.concern.eyebrow')} title={<span id="home-concern">{t('home.concern.title')}</span>} description={t('home.concern.description')} />
        </Reveal>
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          {shopByConcern.map(({ concern, image }, i) => (
            <Reveal as="li" key={concern} delay={(i % 4) * 70}>
              <Link to={concernHref(concern)} className="group block">
                <span className="relative block overflow-hidden rounded-xs">
                  <SmartImage src={image} alt={l(CONCERN_LABELS[concern])} width={600} height={720} wrapperClassName="aspect-[5/6]" className="transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/15" aria-hidden />
                </span>
                <span className="mt-3 flex items-center justify-between gap-2 sm:mt-4">
                  <span className="font-serif text-lg leading-snug font-medium text-ink sm:text-xl">{l(CONCERN_LABELS[concern])}</span>
                  <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-muted transition-colors group-hover:text-rose sm:inline-flex">
                    {t('home.concern.shop')}
                    <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ---------------- Editorial ritual banner ---------------- */

export function RitualBanner() {
  const { t } = useT()
  return (
    <section className="container-x py-16 sm:py-20 lg:py-28" aria-labelledby="home-ritual">
      <Reveal className="relative">
        <SmartImage src={EDITORIAL.ritual} alt="" width={1800} height={900} wrapperClassName="aspect-[4/5] rounded-xs sm:aspect-[16/10] lg:aspect-[16/7]" />
        <div className="relative -mt-24 mx-4 bg-ivory p-7 shadow-lift sm:mx-10 sm:-mt-32 sm:p-10 lg:absolute lg:end-12 lg:bottom-12 lg:mx-0 lg:mt-0 lg:max-w-md lg:p-12 rounded-xs">
          <p className="eyebrow">{t('home.ritual.eyebrow')}</p>
          <h2 id="home-ritual" className="heading-section mt-3 text-balance">
            {t('home.ritual.title')}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">{t('home.ritual.body')}</p>
          <ButtonLink to="/category/skin-care" variant="dark" className="mt-8">
            {t('home.ritual.cta')}
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  )
}

/* ---------------- Salon professional ---------------- */

function ProMiniCard({ product }: { product: Product }) {
  return (
    <Link to={`/product/${product.slug}`} className="group flex items-center gap-4 rounded-xs border border-white/10 bg-white/[0.04] p-3 transition-colors hover:border-white/25 hover:bg-white/[0.08]">
      <SmartImage src={product.thumbnail} alt={product.name} width={160} height={200} wrapperClassName="aspect-[4/5] w-16 shrink-0 rounded-xs" className="transition-transform duration-500 group-hover:scale-105" />
      <span className="min-w-0">
        <span className="block truncate text-[10px] font-semibold tracking-[0.2em] text-champagne uppercase">{product.brandName}</span>
        <span className="mt-1 line-clamp-2 block text-sm leading-snug text-ivory">{product.name}</span>
        <span className="mt-1.5 block text-sm font-semibold text-ivory/80 tabular-nums"><Money value={product.price} /></span>
      </span>
    </Link>
  )
}

export function ProfessionalSection() {
  const { t } = useT()
  const { data, loading } = useAsync(() => getProfessionalProducts(4), [])
  const points = [
    { icon: Sparkles, key: 'grade' },
    { icon: Scissors, key: 'salon' },
    { icon: Boxes, key: 'bulk' },
    { icon: BadgeCheck, key: 'authentic' },
  ]
  return (
    <section className="bg-ink py-16 text-ivory sm:py-20 lg:py-28" aria-labelledby="home-pro">
      <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
        <Reveal className="relative lg:col-span-5">
          <SmartImage src={EDITORIAL.professional} alt="" width={900} height={1125} wrapperClassName="aspect-[4/5] rounded-xs" />
          <span className="absolute -bottom-5 start-5 inline-flex items-center gap-2 rounded-full bg-champagne px-5 py-2.5 text-xs font-semibold tracking-[0.18em] text-ink uppercase shadow-lift sm:start-8">
            <Scissors className="size-4" aria-hidden />
            {t('common.professional')}
          </span>
        </Reveal>
        <div className="lg:col-span-7">
          <Reveal>
            <p className="eyebrow text-champagne">{t('home.pro.eyebrow')}</p>
            <h2 id="home-pro" className="heading-section mt-3 max-w-xl text-balance text-ivory">
              {t('home.pro.title')}
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ivory/65 sm:text-base">{t('home.pro.body')}</p>
          </Reveal>
          <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
            {points.map(({ icon: Icon, key }, i) => (
              <Reveal as="li" key={key} delay={i * 70} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-champagne/40 text-champagne">
                  <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-ivory">{t(`home.pro.points.${key}`)}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ivory/60">{t(`home.pro.points.${key}Desc`)}</span>
                </span>
              </Reveal>
            ))}
          </ul>
          <Reveal className="mt-10">
            <ButtonLink to="/category/salon-supplies" size="lg">
              {t('home.pro.cta')}
            </ButtonLink>
          </Reveal>

          {(loading || !!data?.length) && (
            <div className="mt-12 border-t border-white/10 pt-8">
              <p className="mb-4 text-[11px] font-semibold tracking-[0.22em] text-ivory/50 uppercase">{t('home.pro.picks')}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {loading || !data
                  ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[104px] opacity-15" />)
                  : data.map((p) => <ProMiniCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
