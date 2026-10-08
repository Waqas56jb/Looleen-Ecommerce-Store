import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react'
import { Badge, Modal, SmartImage } from '@/components/common'
import { useT } from '@/i18n'
import type { Product } from '@/types'
import { cn } from '@/utils'

/** Sale / new / professional badges over the main image */
function GalleryBadges({ product }: { product: Product }) {
  const { t } = useT()
  if (!product.isOnSale && !product.isNewArrival && !product.professionalProduct) return null
  return (
    <div className="pointer-events-none absolute start-3 top-3 z-10 flex flex-col items-start gap-1.5 sm:start-4 sm:top-4">
      {product.isOnSale && product.discountPercentage > 0 && <Badge tone="rose">{t('common.off', { value: product.discountPercentage })}</Badge>}
      {product.isNewArrival && <Badge tone="ink">{t('common.new')}</Badge>}
      {product.professionalProduct && <Badge tone="champagne">{t('common.professional')}</Badge>}
    </div>
  )
}

/**
 * Product gallery.
 * - Desktop: vertical thumbnails on the inline-start side, hover zoom that
 *   follows the cursor, click to open a full-screen lightbox.
 * - Mobile: swipeable scroll-snap carousel with dots + thumbnail row.
 */
export function ImageGallery({ product }: { product: Product }) {
  const { t, isRTL } = useT()
  const images = product.images.length ? product.images : [product.thumbnail]
  const total = images.length
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  // Mobile carousel: track which slide is visible (works in LTR and RTL)
  useEffect(() => {
    const root = trackRef.current
    if (!root || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index))
        })
      },
      { root, threshold: 0.6 },
    )
    slideRefs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [total])

  const goToSlide = (i: number) => {
    setActive(i)
    // scrollIntoView handles RTL scroll coordinates for us
    slideRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  const step = useCallback((dir: 1 | -1) => setActive((i) => (i + dir + total) % total), [total])

  // Arrow keys inside the lightbox (mirrored in RTL)
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(isRTL ? -1 : 1)
      if (e.key === 'ArrowLeft') step(isRTL ? 1 : -1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, step, isRTL])

  const onMove = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }

  return (
    <section aria-label={t('product.gallery.label')} className="min-w-0">
      {/* ---------- Mobile / tablet carousel ---------- */}
      <div className="lg:hidden">
        <div className="relative -mx-4 sm:mx-0">
          <div ref={trackRef} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain">
            {images.map((src, i) => (
              <div
                key={src + i}
                ref={(el) => {
                  slideRefs.current[i] = el
                }}
                data-index={i}
                className="w-full shrink-0 snap-center"
                aria-roledescription="slide"
                aria-label={t('product.gallery.image', { index: i + 1, total })}
              >
                <button type="button" onClick={() => setLightbox(true)} className="block w-full" aria-label={t('product.gallery.openZoom')}>
                  <SmartImage src={src} alt={i === 0 ? product.name : `${product.name} — ${i + 1}`} width={900} height={1125} priority={i === 0} wrapperClassName="aspect-[4/5] sm:rounded-xs" />
                </button>
              </div>
            ))}
          </div>
          <GalleryBadges product={product} />
          {total > 1 && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5" aria-hidden>
              {images.map((_, i) => (
                <span key={i} className={cn('h-1.5 rounded-full transition-all duration-300', i === active ? 'w-5 bg-ink' : 'w-1.5 bg-ink/25')} />
              ))}
            </div>
          )}
        </div>
        {total > 1 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => goToSlide(i)}
                aria-label={t('product.gallery.showImage', { index: i + 1 })}
                aria-current={i === active || undefined}
                className={cn('w-16 shrink-0 overflow-hidden rounded-xs ring-1 transition', i === active ? 'ring-ink' : 'opacity-60 ring-transparent hover:opacity-100')}
              >
                <SmartImage src={src} alt="" width={160} height={200} wrapperClassName="aspect-[4/5]" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ---------- Desktop ---------- */}
      <div className="hidden gap-4 lg:flex">
        {total > 1 && (
          <div className="flex w-20 shrink-0 flex-col gap-3" role="list">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                role="listitem"
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                aria-label={t('product.gallery.showImage', { index: i + 1 })}
                aria-current={i === active || undefined}
                className={cn('overflow-hidden rounded-xs ring-1 ring-offset-2 ring-offset-ivory transition', i === active ? 'ring-ink' : 'opacity-60 ring-transparent hover:opacity-100')}
              >
                <SmartImage src={src} alt="" width={200} height={250} wrapperClassName="aspect-[4/5]" />
              </button>
            ))}
          </div>
        )}
        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setLightbox(true)}
            onMouseMove={onMove}
            onMouseLeave={() => setZoom(null)}
            aria-label={t('product.gallery.openZoom')}
            className="group block w-full cursor-zoom-in overflow-hidden rounded-xs"
          >
            <div
              className="transition-transform duration-300 ease-out"
              style={{ transform: zoom ? 'scale(1.8)' : 'scale(1)', transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : 'center' }}
            >
              <SmartImage key={images[active]} src={images[active]} alt={product.name} width={1200} height={1500} priority wrapperClassName="aspect-[4/5]" />
            </div>
            <span className="pointer-events-none absolute end-4 bottom-4 grid size-10 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-soft transition-opacity group-hover:opacity-100" aria-hidden>
              <Expand className="size-4" />
            </span>
          </button>
          <GalleryBadges product={product} />
        </div>
      </div>

      {/* ---------- Lightbox ---------- */}
      <Modal open={lightbox} onClose={() => setLightbox(false)} size="xl" title={t('product.gallery.fullscreen', { name: product.name })} className="bg-ivory">
        <div className="relative">
          <SmartImage key={images[active]} src={images[active]} alt={product.name} width={1400} height={1750} wrapperClassName="mx-auto aspect-[4/5] max-h-[72dvh] rounded-xs" className="object-contain" />
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={t('product.gallery.previous')}
                className="absolute start-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-soft transition-colors hover:bg-white sm:start-4"
              >
                <ChevronLeft className="size-5 rtl:-scale-x-100" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={t('product.gallery.next')}
                className="absolute end-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-soft transition-colors hover:bg-white sm:end-4"
              >
                <ChevronRight className="size-5 rtl:-scale-x-100" />
              </button>
            </>
          )}
        </div>
        {total > 1 && (
          <p className="mt-4 text-center text-xs tracking-[0.2em] text-muted" aria-live="polite" dir="ltr">
            {active + 1} / {total}
          </p>
        )}
      </Modal>
    </section>
  )
}
