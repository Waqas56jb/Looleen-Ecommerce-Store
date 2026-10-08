/**
 * Small form helpers shared by the category and brand forms.
 */
import { useId, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Field, Img, fieldClass } from '@/components/ui'
import { cn } from '@/utils'

/** Sticky Cancel / Save bar at the bottom of create & edit pages */
export function StickyActionBar({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 mt-6 border-t border-line bg-ivory/90 py-3 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {note && <p className="me-auto min-w-0 text-xs text-muted max-sm:w-full">{note}</p>}
        {children}
      </div>
    </div>
  )
}

/** "12 / 60" counter that turns red past the limit */
export function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <span className={cn('tabular-nums', value.length > max ? 'font-medium text-error' : value.length > max * 0.9 ? 'text-warning' : 'text-subtle')} dir="ltr">
      {value.length} / {max}
    </span>
  )
}

interface ImageUrlFieldProps {
  label: ReactNode
  value: string
  onChange: (v: string) => void
  error?: string
  hint?: ReactNode
  required?: boolean
  samples: string[]
  samplesLabel: string
  sampleAria: string
  /** Preview aspect (tailwind class) */
  previewClass?: string
  /** Use object-contain (logos) */
  contain?: boolean
}

/** Image URL input with a live preview and one-click sample images */
export function ImageUrlField({ label, value, onChange, error, hint, required, samples, samplesLabel, sampleAria, previewClass = 'aspect-[4/3]', contain }: ImageUrlFieldProps) {
  const id = useId()
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
      <div className="min-w-0 space-y-3">
        <Field id={id} label={label} error={error} hint={hint} required={required}>
          <input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            dir="ltr"
            placeholder="https://… or photo-…"
            aria-invalid={!!error || undefined}
            className={cn(fieldClass, 'h-9 text-start')}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <span>{samplesLabel}:</span>
          {samples.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              aria-label={sampleAria}
              aria-pressed={value === s}
              className={cn('relative overflow-hidden rounded-md border transition-colors', value === s ? 'border-ink ring-2 ring-rose/25' : 'border-line hover:border-ink/40')}
            >
              <Img src={s} alt="" w={80} h={80} className="size-9" />
              {value === s && (
                <span className="absolute inset-0 grid place-items-center bg-ink/40 text-white">
                  <Check className="size-3.5" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className={cn('overflow-hidden rounded-md border border-line bg-mist', previewClass)}>
        <Img src={value || undefined} alt="" w={400} className={cn('size-full', contain && 'bg-white object-contain p-3')} key={value} />
      </div>
    </div>
  )
}

/** Wraps a search match in <mark> */
export function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-champagne-soft px-0.5 text-ink ring-1 ring-champagne/40">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
