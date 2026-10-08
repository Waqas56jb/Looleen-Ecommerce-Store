import { useCallback, useEffect, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { ButtonLink, SmartImage } from '@/components/common'
import { useAsync, useMediaQuery } from '@/hooks'
import { useT } from '@/i18n'
import { getHeroBanners } from '@/services/catalogService'
import { cn } from '@/utils'

const INTERVAL = 6000
const HEIGHT = 'h-[78svh] min-h-[540px] max-h-[760px] lg:h-[min(88vh,820px)] lg:max-h-none'

/** Thin progress fill for the active dot; remounted (via key) on every slide/play change */
function DotFill({ running }: { running: boolean }) {
  const [go, setGo] = useState(false)
  useEffect(() => {
    if (!running) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setGo(true)))
    return () => cancelAnimationFrame(id)
  }, [running])
  return (
    <span
      className={cn('absolute inset-0 origin-left bg-white ease-linear rtl:origin-right', running && !go ? 'scale-x-0' : 'scale-x-100')}
      style={{ transitionProperty: 'transform', transitionDuration: running && go ? `${INTERVAL}ms` : '0ms' }}
    />
  )
}

export function HeroSlider() {
  const { t, l, isRTL } = useT()
  const { data: slides, loading } = useAsync(() => getHeroBanners(), [])
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const count = slides?.length ?? 0
  const playing = count > 1 && !hovered && !focused && !userPaused && !reducedMotion

  const go = useCallback((i: number) => setIndex(() => (count ? (i + count) % count : 0)), [count])
  const next = useCallback(() => setIndex((i) => (count ? (i + 1) % count : 0)), [count])
  const prev = useCallback(() => setIndex((i) => (count ? (i - 1 + count) % count : 0)), [count])

  useEffect(() => {
    if (!playing) return
    const id = setTimeout(next, INTERVAL)
    return () => clearTimeout(id)
  }, [playing, index, next])

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const forward = (e.key === 'ArrowRight') !== isRTL
    if (forward) next()
    else prev()
  }

  if (loading || !slides?.length) {
    return <div className={cn('skeleton rounded-none', HEIGHT)} role="status" aria-label={t('common.loading')} />
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t('home.hero.label')}
      className={cn('relative isolate overflow-hidden bg-ink', HEIGHT)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
      onKeyDown={onKeyDown}
    >
      <div aria-live={playing ? 'off' : 'polite'} className="absolute inset-0">
        {slides.map((s, i) => {
          const active = i === index
          return (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-label={t('home.hero.slide', { n: i + 1, total: count })}
              aria-hidden={!active}
              inert={!active}
              className={cn('absolute inset-0 transition-opacity duration-[1200ms] ease-out', active ? 'z-10 opacity-100' : 'z-0 opacity-0')}
            >
              <span className={cn('absolute inset-0 transition-transform duration-[7000ms] ease-out will-change-transform', active ? 'scale-[1.06]' : 'scale-100')}>
                <SmartImage src={s.image} alt="" width={1920} height={1100} priority={i === 0} wrapperClassName="size-full bg-ink" />
              </span>
              {/* Ink overlays for legibility: bottom fade on mobile, side fade on desktop */}
              <span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/5 lg:bg-gradient-to-r lg:from-ink/75 lg:via-ink/35 lg:to-transparent lg:rtl:bg-gradient-to-l" aria-hidden />

              <div className="relative flex h-full items-end pb-24 sm:pb-28 lg:items-center lg:pb-0">
                <div className="container-x">
                  <div className={cn('max-w-[640px] text-ivory', active && 'animate-fade-up')} style={active ? { animationDelay: '250ms' } : undefined}>
                    <p className="eyebrow text-champagne">{l(s.eyebrow)}</p>
                    <h2 className="heading-hero mt-4 text-balance text-white sm:mt-5">{l(s.title)}</h2>
                    <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ivory/80 sm:mt-6 sm:text-lg">{l(s.subtitle)}</p>
                    <div className="mt-7 flex flex-wrap gap-3 sm:mt-9">
                      <ButtonLink to={s.ctaHref} size="lg">
                        {l(s.ctaLabel)}
                      </ButtonLink>
                      {s.secondaryCtaHref && s.secondaryCtaLabel && (
                        <Link
                          to={s.secondaryCtaHref}
                          className="inline-flex h-13 items-center justify-center rounded-full border border-white/70 px-8 text-[15px] font-medium tracking-wide whitespace-nowrap text-white transition-all duration-300 ease-out hover:bg-white hover:text-ink active:scale-[0.98]"
                        >
                          {l(s.secondaryCtaLabel)}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Controls */}
      {count > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-20">
          <div className="container-x flex items-center justify-between gap-4 pb-6 sm:pb-8 lg:pb-10">
            <div className="flex items-center gap-1">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={t('home.hero.goTo', { n: i + 1 })}
                  aria-current={i === index ? 'true' : undefined}
                  className="group flex h-11 items-center px-1.5"
                >
                  <span className={cn('relative block h-[2px] overflow-hidden rounded-full bg-white/35 transition-all duration-500', i === index ? 'w-12' : 'w-6 group-hover:bg-white/60')}>
                    {i === index && <DotFill key={`${index}-${playing}`} running={playing} />}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUserPaused((p) => !p)}
                aria-label={userPaused ? t('home.hero.play') : t('home.hero.pause')}
                className="ms-2 grid size-11 place-items-center rounded-full text-white/80 transition-colors hover:text-white"
              >
                {userPaused ? <Play className="size-3.5" fill="currentColor" /> : <Pause className="size-3.5" fill="currentColor" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="me-2 hidden font-serif text-lg text-white/80 tabular-nums sm:inline" dir="ltr" aria-hidden>
                {String(index + 1).padStart(2, '0')} <span className="text-white/40">/ {String(count).padStart(2, '0')}</span>
              </span>
              <button
                type="button"
                onClick={prev}
                aria-label={t('home.hero.previous')}
                className="grid size-11 place-items-center rounded-full border border-white/40 text-white transition-colors hover:bg-white hover:text-ink"
              >
                <ChevronLeft className="size-5 rtl:-scale-x-100" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label={t('home.hero.next')}
                className="grid size-11 place-items-center rounded-full border border-white/40 text-white transition-colors hover:bg-white hover:text-ink"
              >
                <ChevronRight className="size-5 rtl:-scale-x-100" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
