import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton, Img } from '@/components/ui'
import { useT } from '@/i18n'
import { cn } from '@/utils'

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const { t } = useT()
  const [i, setI] = useState(0)
  const idx = Math.min(i, Math.max(0, images.length - 1))
  const go = (d: number) => images.length && setI((idx + d + images.length) % images.length)
  return (
    <div className="card overflow-hidden p-3">
      <div className="group relative overflow-hidden rounded-md bg-mist">
        <Img src={images[idx]} alt={images.length ? t('products.detail.imageOf', { n: idx + 1, total: images.length }) : name} w={900} h={900} className="aspect-square w-full" />
        {images.length > 1 && (
          <>
            <IconButton label={t('common.previous')} variant="outline" size="sm" onClick={() => go(-1)} className="absolute start-2 top-1/2 -translate-y-1/2 bg-surface/90 shadow-card">
              <ChevronLeft className="rtl:-scale-x-100" />
            </IconButton>
            <IconButton label={t('common.next')} variant="outline" size="sm" onClick={() => go(1)} className="absolute end-2 top-1/2 -translate-y-1/2 bg-surface/90 shadow-card">
              <ChevronRight className="rtl:-scale-x-100" />
            </IconButton>
            <span className="absolute end-2 bottom-2 rounded bg-ink/75 px-1.5 py-0.5 text-[11px] text-white tabular-nums" dir="ltr">
              {idx + 1}/{images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, n) => (
            <button
              key={src}
              type="button"
              onClick={() => setI(n)}
              aria-label={t('products.detail.imageOf', { n: n + 1, total: images.length })}
              aria-current={n === idx || undefined}
              className={cn('shrink-0 overflow-hidden rounded-md border-2 transition-colors', n === idx ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100')}
            >
              <Img src={src} alt="" w={140} h={140} className="size-16" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
