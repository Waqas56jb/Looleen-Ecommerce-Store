import { useRef } from 'react'
import { BadgeCheck, Check, ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { IconButton, RatingStars, Reveal, SectionHeading, Skeleton, SmartImage } from '@/components/common'
import { NewsletterForm } from '@/components/layout/footer/Footer'
import { STORE_CONFIG } from '@/config/store'
import { EDITORIAL } from '@/data/images'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getTestimonials } from '@/services/catalogService'

/* ---------------- Testimonials ---------------- */

export function Testimonials() {
  const { t, l, isRTL } = useT()
  const { data, loading } = useAsync(() => getTestimonials(), [])
  const ref = useRef<HTMLUListElement>(null)
  if (!loading && !data?.length) return null

  const scroll = (dir: 1 | -1) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9 * (isRTL ? -1 : 1), behavior: 'smooth' })
  }

  return (
    <section className="container-x py-16 sm:py-20 lg:py-28" aria-labelledby="home-testimonials">
      <Reveal>
        <SectionHeading
          eyebrow={t('home.testimonials.eyebrow')}
          title={<span id="home-testimonials">{t('home.testimonials.title')}</span>}
          action={
            <div className="hidden gap-2 sm:flex">
              <IconButton label={t('common.previous')} variant="outline" onClick={() => scroll(-1)}>
                <ChevronLeft className="size-5 rtl:-scale-x-100" />
              </IconButton>
              <IconButton label={t('common.next')} variant="outline" onClick={() => scroll(1)}>
                <ChevronRight className="size-5 rtl:-scale-x-100" />
              </IconButton>
            </div>
          }
        />
      </Reveal>
      <ul ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:gap-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0">
        {loading || !data
          ? Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="w-[86%] shrink-0 sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                <Skeleton className="h-72" />
              </li>
            ))
          : data.map((item) => (
              <li key={item.id} className="w-[86%] shrink-0 snap-start sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                <figure className="flex h-full flex-col rounded-xs border border-line bg-white p-7 sm:p-9">
                  <Quote className="size-8 text-champagne rtl:-scale-x-100" strokeWidth={1.2} aria-hidden />
                  <RatingStars rating={item.rating} className="mt-5" />
                  <blockquote className="mt-4 flex-1 font-serif text-xl leading-snug text-ink sm:text-[22px]">“{l(item.text)}”</blockquote>
                  <figcaption className="mt-7 flex items-center gap-3 border-t border-line pt-5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush font-serif text-lg text-rose" aria-hidden>
                      {item.name.charAt(0)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">{item.name}</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted">
                        {l(item.city)}
                        <span aria-hidden>·</span>
                        <BadgeCheck className="size-3.5 text-success" aria-hidden />
                        {t('home.testimonials.verified')}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
      </ul>
    </section>
  )
}

/* ---------------- Newsletter ---------------- */

export function NewsletterSection() {
  const { t } = useT()
  const perks = ['early', 'launches', 'tips']
  return (
    <section className="container-x py-16 sm:py-20 lg:py-24" aria-labelledby="home-newsletter">
      <Reveal className="grid grid-cols-1 overflow-hidden rounded-xs bg-blush lg:grid-cols-2">
        <SmartImage src={EDITORIAL.newsletter} alt="" width={1000} height={800} wrapperClassName="aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[480px]" />
        <div className="flex flex-col justify-center p-7 sm:p-12 lg:p-16">
          <p className="eyebrow">{t('home.newsletter.eyebrow')}</p>
          <h2 id="home-newsletter" className="heading-section mt-3 text-balance">
            {t('common.newsletterTitle')}
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">{t('common.newsletterDesc')}</p>
          <ul className="mt-6 space-y-2.5">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm text-ink">
                <span className="grid size-5 place-items-center rounded-full bg-white text-rose">
                  <Check className="size-3" strokeWidth={2.5} aria-hidden />
                </span>
                {t(`home.newsletter.perks.${p}`)}
              </li>
            ))}
          </ul>
          <div className="mt-8 max-w-md">
            <NewsletterForm tone="dark" />
          </div>
          <p className="mt-3 text-xs text-muted">{t('home.newsletter.privacy')}</p>
        </div>
      </Reveal>
    </section>
  )
}

/* ---------------- Instagram-style gallery ---------------- */

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  )
}

export function InstagramGallery() {
  const { t } = useT()
  const href = STORE_CONFIG.social.instagram
  return (
    <section className="pb-16 sm:pb-20 lg:pb-28" aria-labelledby="home-gallery">
      <Reveal className="container-x mb-8 flex flex-col items-center text-center sm:mb-10">
        <p className="eyebrow">{t('home.gallery.eyebrow')}</p>
        <h2 id="home-gallery" className="heading-section mt-3">
          {t('home.gallery.title')}
        </h2>
        <a href={href} target="_blank" rel="noreferrer" className="group mt-5 inline-flex items-center gap-2 text-sm font-medium text-ink">
          <InstagramGlyph className="size-4" />
          <span className="link-underline">{t('home.gallery.cta')}</span>
        </a>
      </Reveal>
      <ul className="grid grid-cols-3 gap-1 sm:gap-2 lg:grid-cols-6">
        {EDITORIAL.gallery.map((src, i) => (
          <Reveal as="li" key={src} delay={i * 60}>
            <a href={href} target="_blank" rel="noreferrer" className="group relative block overflow-hidden" aria-label={`${t('home.gallery.itemLabel')} — @looks.sa`}>
              <SmartImage src={src} alt="" width={500} height={500} wrapperClassName="aspect-square" className="transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 grid place-items-center bg-ink/0 text-white opacity-0 transition-all duration-300 group-hover:bg-ink/40 group-hover:opacity-100 group-focus-visible:bg-ink/40 group-focus-visible:opacity-100">
                <span className="flex flex-col items-center gap-2">
                  <InstagramGlyph className="size-7" />
                  <span className="text-xs font-medium tracking-wide" dir="ltr">
                    @looks.sa
                  </span>
                </span>
              </span>
            </a>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
