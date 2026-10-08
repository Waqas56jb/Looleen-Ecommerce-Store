import { Link } from 'react-router-dom'
import { ArrowLink, Reveal, SectionHeading, Skeleton } from '@/components/common'
import { useAsync } from '@/hooks'
import { useT } from '@/i18n'
import { getFeaturedBrands, type BrandWithCount } from '@/services/catalogService'
import { cn } from '@/utils'

const EDGE_FADE = 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)'

/** Rotating wordmark treatments so the strip reads like a wall of logos */
const WORDMARK_STYLES = [
  'font-serif text-[22px] font-medium tracking-[0.18em] uppercase',
  'font-sans text-[15px] font-bold tracking-[0.32em] uppercase',
  'font-serif text-[26px] italic font-medium tracking-[0.02em]',
  'font-sans text-[13px] font-semibold tracking-[0.45em] uppercase',
  'font-serif text-[20px] font-semibold tracking-[0.28em] uppercase',
]

function BrandCard({ brand, index, hidden }: { brand: BrandWithCount; index: number; hidden?: boolean }) {
  return (
    <Link
      to={`/brand/${brand.slug}`}
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden || undefined}
      className="group flex h-28 w-52 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-xs border border-line bg-white px-5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-soft sm:h-32 sm:w-60"
    >
      <span className={cn('line-clamp-2 leading-tight text-ink transition-colors group-hover:text-rose', WORDMARK_STYLES[index % WORDMARK_STYLES.length])} dir="ltr" lang="en">
        {brand.name}
      </span>
      <span className="text-[10px] tracking-[0.2em] text-muted uppercase">{brand.country}</span>
    </Link>
  )
}

export function FeaturedBrands() {
  const { t } = useT()
  const { data, loading } = useAsync(() => getFeaturedBrands(), [])
  const brands = data?.slice(0, 15) ?? []

  return (
    <section className="overflow-hidden border-y border-line bg-mist py-16 sm:py-20 lg:py-24" aria-labelledby="home-brands">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            eyebrow={t('home.brands.eyebrow')}
            title={<span id="home-brands">{t('home.brands.title')}</span>}
            description={t('home.brands.description')}
            action={<ArrowLink to="/brands">{t('home.brands.all')}</ArrowLink>}
          />
        </Reveal>
      </div>

      {loading ? (
        <div className="container-x flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28 w-52 shrink-0 sm:h-32 sm:w-60" />
          ))}
        </div>
      ) : (
        <>
          {/* Mobile / tablet: swipeable strip */}
          <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 sm:scroll-px-6 sm:px-6 lg:hidden">
            {brands.map((b, i) => (
              <BrandCard key={b.id} brand={b} index={i} />
            ))}
          </div>

          {/* Desktop: slow marquee, paused on hover / focus */}
          <div className="group/marquee relative hidden lg:block" style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}>
            <div className="flex w-max animate-marquee group-focus-within/marquee:[animation-play-state:paused] group-hover/marquee:[animation-play-state:paused]" style={{ animationDuration: '60s' }}>
              {[0, 1].map((copy) => (
                <div key={copy} className="flex gap-4 pe-4" aria-hidden={copy === 1 || undefined}>
                  {brands.map((b, i) => (
                    <BrandCard key={`${copy}-${b.id}`} brand={b} index={i} hidden={copy === 1} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
