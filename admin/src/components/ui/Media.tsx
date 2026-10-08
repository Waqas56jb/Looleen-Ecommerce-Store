import { useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from 'lucide-react'
import { IMAGE_POOL } from '@/data/catalog/images'
import { useT } from '@/i18n'
import { cn, isValidUrl } from '@/utils'
import { Button, IconButton } from './Button'
import { Img } from './Display'
import { fieldClass } from './Form'

const SAMPLE_IMAGES = [IMAGE_POOL.serum[0], IMAGE_POOL.cream[0], IMAGE_POOL.lipstick[3], IMAGE_POOL.perfume[1], IMAGE_POOL.hairoil[0]]

interface ImageUploaderMockProps {
  value: string[]
  onChange: (v: string[]) => void
  max?: number
  label?: string
}

/**
 * Mock image manager: add by URL (or Unsplash id), preview, remove, reorder.
 * No real upload — the backend phase will swap this for signed uploads.
 * The first image is the primary/cover image.
 */
export function ImageUploaderMock({ value, onChange, max = 8, label }: ImageUploaderMockProps) {
  const { lang } = useT()
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const L = (en: string, ar: string) => (lang === 'ar' ? ar : en)
  const add = (src: string) => {
    const s = src.trim()
    if (!s) return
    if (!isValidUrl(s)) return setError(L('Enter a valid image URL', 'أدخل رابط صورة صحيحًا'))
    if (value.includes(s)) return setError(L('This image is already added', 'هذه الصورة مضافة بالفعل'))
    if (value.length >= max) return setError(L(`Maximum ${max} images`, `الحد الأقصى ${max} صور`))
    onChange([...value, s])
    setUrl('')
    setError('')
  }
  const move = (i: number, d: -1 | 1) => {
    const next = [...value]
    const j = i + d
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  return (
    <div className="space-y-3">
      {label && <p className="text-[13px] font-medium text-ink">{label}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {value.map((src, i) => (
          <figure key={src} className={cn('group relative overflow-hidden rounded-md border bg-mist', i === 0 ? 'border-ink/30' : 'border-line')}>
            <Img src={src} alt={`Image ${i + 1}`} w={320} h={320} className="aspect-square w-full" />
            {i === 0 && (
              <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded bg-ink/85 px-1.5 py-0.5 text-[10px] font-medium text-white">
                <Star className="size-3" fill="currentColor" /> {L('Cover', 'الغلاف')}
              </span>
            )}
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1 rounded bg-white/90 p-0.5 opacity-100 shadow-card backdrop-blur transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
              <IconButton label={L('Move up', 'تحريك للأعلى')} size="xs" onClick={() => move(i, -1)} disabled={i === 0}>
                <ArrowUp className="rtl:rotate-0" />
              </IconButton>
              <IconButton label={L('Move down', 'تحريك للأسفل')} size="xs" onClick={() => move(i, 1)} disabled={i === value.length - 1}>
                <ArrowDown />
              </IconButton>
              <IconButton label={L('Remove image', 'إزالة الصورة')} size="xs" variant="danger" onClick={() => onChange(value.filter((x) => x !== src))}>
                <Trash2 />
              </IconButton>
            </div>
          </figure>
        ))}
        {value.length < max && (
          <div className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line bg-mist/50 p-3 text-center text-xs text-muted">
            <ImagePlus className="size-5 text-subtle" aria-hidden />
            {L('Add an image by URL below', 'أضف صورة عبر الرابط أدناه')}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setError('')
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add(url))}
          placeholder="https://… or photo-… (Unsplash id)"
          dir="ltr"
          aria-label={L('Image URL', 'رابط الصورة')}
          aria-invalid={!!error || undefined}
          className={cn(fieldClass, 'h-9 flex-1')}
        />
        <Button variant="outline" onClick={() => add(url)}>
          {L('Add', 'إضافة')}
        </Button>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <span>{L('Samples:', 'نماذج:')}</span>
        {SAMPLE_IMAGES.filter((s) => !value.includes(s))
          .slice(0, 4)
          .map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="overflow-hidden rounded border border-line hover:border-ink/40" aria-label={L('Add sample image', 'إضافة صورة نموذجية')}>
              <Img src={s} alt="" w={64} h={64} className="size-8" />
            </button>
          ))}
      </div>
    </div>
  )
}

/** Small file/image preview row */
export function FilePreview({ src, name, meta }: { src?: string; name: string; meta?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-line bg-surface p-2">
      <Img src={src} alt={name} w={96} h={96} className="size-10 rounded" />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-ink">{name}</p>
        {meta && <p className="text-xs text-muted">{meta}</p>}
      </div>
    </div>
  )
}
