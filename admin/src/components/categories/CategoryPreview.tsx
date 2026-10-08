import { ArrowRight } from 'lucide-react'
import { Img, Segmented } from '@/components/ui'
import { useT } from '@/i18n'
import type { LocalizedText } from '@/types'
import { cn, formatNumber } from '@/utils'
import { useState } from 'react'

interface CategoryPreviewProps {
  name: LocalizedText
  image: string
  productCount: number
  parentName?: string
  active: boolean
}

/** Mimics the storefront category tile in a desktop browser frame and a phone frame */
export function CategoryPreview(props: CategoryPreviewProps) {
  const { t } = useT()
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop')
  return (
    <section className="card overflow-hidden">
      <header className="flex items-start justify-between gap-3 border-b border-line-soft px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{t('catalog.categoryForm.preview')}</h2>
          <p className="mt-0.5 text-[13px] text-muted">{t('catalog.categoryForm.previewDesc')}</p>
        </div>
        <Segmented
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'desktop', label: t('common.desktop') },
            { value: 'mobile', label: t('common.mobile') },
          ]}
        />
      </header>
      <div className={cn('bg-mist p-5 transition-opacity', !props.active && 'opacity-60')}>
        {mode === 'desktop' ? (
          <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
            <div className="flex items-center gap-1.5 border-b border-line-soft bg-mist/70 px-3 py-2" aria-hidden>
              <span className="size-2 rounded-full bg-line" />
              <span className="size-2 rounded-full bg-line" />
              <span className="size-2 rounded-full bg-line" />
              <span className="ms-2 h-4 flex-1 rounded bg-surface" />
            </div>
            <div className="grid grid-cols-3 gap-2 bg-ivory p-3">
              <Tile {...props} />
              <div className="aspect-[3/4] rounded-md bg-blush/60" aria-hidden />
              <div className="aspect-[3/4] rounded-md bg-champagne-soft" aria-hidden />
            </div>
          </div>
        ) : (
          <div className="mx-auto w-[220px] rounded-[28px] border-[6px] border-ink bg-ink p-0 shadow-pop">
            <div className="overflow-hidden rounded-[22px] bg-ivory">
              <div className="mx-auto mt-1.5 h-1.5 w-14 rounded-full bg-ink/80" aria-hidden />
              <div className="space-y-2 p-2.5 pt-3">
                <Tile {...props} wide />
                <div className="grid grid-cols-2 gap-2" aria-hidden>
                  <div className="h-14 rounded-md bg-blush/60" />
                  <div className="h-14 rounded-md bg-champagne-soft" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function Tile({ name, image, productCount, parentName, wide }: CategoryPreviewProps & { wide?: boolean }) {
  const { t, lang } = useT()
  const title = (lang === 'ar' ? name.ar : name.en) || (lang === 'ar' ? name.en : name.ar) || t('catalog.categoryForm.untitled')
  return (
    <div className={cn('relative overflow-hidden rounded-md bg-blush', wide ? 'aspect-[16/10]' : 'aspect-[3/4]')}>
      <Img src={image || undefined} alt="" w={500} className="absolute inset-0 size-full" key={image} />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 p-2.5 text-white">
        {parentName && <p className="text-[8px] font-semibold tracking-[0.18em] text-white/70 uppercase">{parentName}</p>}
        <p className={cn('font-serif leading-tight', wide ? 'text-lg' : 'text-base')}>{title}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[9px] text-white/80">
          {t('catalog.categories.productsCount', { count: formatNumber(productCount) })}
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-0.5 font-medium text-white">
            {t('catalog.categoryForm.shopNow')}
            <ArrowRight className="size-2.5 rtl:-scale-x-100" />
          </span>
        </p>
      </div>
    </div>
  )
}
