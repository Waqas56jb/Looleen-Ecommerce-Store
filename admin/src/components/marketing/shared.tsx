import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Field, Img, Input, SearchInput } from '@/components/ui'
import { IMAGE_POOL } from '@/data/catalog/images'
import { useT } from '@/i18n'
import { cn } from '@/utils'

/* ---------------- Date helpers (form "YYYY-MM-DD" <-> ISO) ---------------- */

/** ISO → "YYYY-MM-DD" in local time (for <DatePicker>) */
export function toDateInput(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** "YYYY-MM-DD" → ISO at start (00:00) or end (23:59:59) of that local day */
export function fromDateInput(value: string, endOfDay = false): string {
  return new Date(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}`).toISOString()
}

export function todayInput(offsetDays = 0): string {
  return toDateInput(new Date(Date.now() + offsetDays * 86_400_000).toISOString())
}

/* ---------------- Code pill with copy ---------------- */

export function CodePill({ code, className, copyable = true }: { code: string; className?: string; copyable?: boolean }) {
  const { t } = useT()
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      /* clipboard unavailable — still confirm */
    }
    setCopied(true)
    toast.success(t('marketing.coupons.codeCopied', { code }))
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <span className={cn('inline-flex max-w-full items-center gap-0.5 rounded-md border border-dashed border-ink/25 bg-mist ps-2 font-mono text-[12.5px] font-semibold tracking-wide text-ink', !copyable && 'pe-2', className)} dir="ltr">
      <span className="truncate py-0.5">{code}</span>
      {copyable && (
        <button type="button" onClick={copy} aria-label={t('marketing.coupons.copyCode')} title={t('marketing.coupons.copyCode')} className="grid size-6 shrink-0 place-items-center rounded text-subtle transition-colors hover:bg-surface hover:text-ink">
          {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
        </button>
      )}
    </span>
  )
}

/* ---------------- Searchable multi-select checkbox list ---------------- */

export interface CheckOption {
  value: string
  label: string
  /** secondary text (e.g. Arabic name, brand) */
  sub?: string
  /** indent as a child row */
  child?: boolean
  thumb?: ReactNode
}

interface MultiCheckListProps {
  label?: ReactNode
  hint?: ReactNode
  options: CheckOption[]
  value: string[]
  onChange: (v: string[]) => void
  searchable?: boolean
  loading?: boolean
  className?: string
  maxHeightClass?: string
}

export function MultiCheckList({ label, hint, options, value, onChange, searchable = true, loading, className, maxHeightClass = 'max-h-60' }: MultiCheckListProps) {
  const { t } = useT()
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return options
    return options.filter((o) => o.label.toLowerCase().includes(term) || o.sub?.toLowerCase().includes(term) || o.value.toLowerCase().includes(term))
  }, [options, q])
  const selected = new Set(value)
  const toggle = (v: string) => onChange(selected.has(v) ? value.filter((x) => x !== v) : [...value, v])
  return (
    <Field label={label} hint={hint} className={className} aside={value.length ? t('marketing.shared.selectedCount', { count: value.length }) : t('marketing.shared.noneSelected')}>
      <div className="overflow-hidden rounded-md border border-line bg-surface">
        {searchable && (
          <div className="flex items-center gap-2 border-b border-line-soft p-2">
            <SearchInput value={q} onChange={setQ} placeholder={t('marketing.shared.searchList')} className="flex-1" />
            {value.length > 0 && (
              <button type="button" onClick={() => onChange([])} className="shrink-0 rounded px-2 py-1 text-xs font-medium text-muted hover:bg-mist hover:text-ink">
                {t('marketing.shared.clearSelection')}
              </button>
            )}
          </div>
        )}
        <ul className={cn('thin-scrollbar overflow-y-auto p-1', maxHeightClass)} role="listbox" aria-multiselectable="true">
          {loading ? (
            Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="p-2">
                <div className="skeleton h-4 w-2/3" />
              </li>
            ))
          ) : filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-xs text-muted">{t('marketing.shared.noMatches')}</li>
          ) : (
            filtered.map((o) => {
              const on = selected.has(o.value)
              return (
                <li key={o.value} role="option" aria-selected={on}>
                  <label className={cn('flex min-h-9 cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-[13px] transition-colors hover:bg-mist', o.child && 'ps-7', on && 'bg-mist')}>
                    <input type="checkbox" checked={on} onChange={() => toggle(o.value)} className="size-4 shrink-0 cursor-pointer rounded-[4px] accent-ink" />
                    {o.thumb}
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate', o.child ? 'text-ink' : 'font-medium text-ink')}>{o.label}</span>
                      {o.sub && <span className="block truncate text-xs text-muted">{o.sub}</span>}
                    </span>
                  </label>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </Field>
  )
}

/* ---------------- Chip toggle group (channels etc.) ---------------- */

export function ChipToggleGroup<V extends string>({ options, value, onChange, label, error }: { options: { value: V; label: string; icon?: ReactNode }[]; value: V[]; onChange: (v: V[]) => void; label?: ReactNode; error?: string }) {
  return (
    <Field label={label} error={error}>
      <div className="flex flex-wrap gap-2" role="group">
        {options.map((o) => {
          const on = value.includes(o.value)
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((x) => x !== o.value) : [...value, o.value])}
              className={cn('inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors [&>svg]:size-3.5', on ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-muted hover:border-ink/30 hover:text-ink')}
            >
              {on ? <Check /> : o.icon}
              {o.label}
            </button>
          )
        })}
      </div>
    </Field>
  )
}

/* ---------------- Sticky action bar for create/edit pages ---------------- */

export function StickyActionBar({ children, status }: { children: ReactNode; status?: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 -mb-6 border-t border-line bg-surface/95 px-4 py-3 shadow-[0_-4px_16px_-8px_rgba(42,30,34,0.12)] backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mb-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {status && <div className="me-auto text-[13px] text-muted">{status}</div>}
        {children}
      </div>
    </div>
  )
}

/** Numeric input value → number | undefined (empty string = undefined) */
export function numOrUndef(v: string): number | undefined {
  if (v.trim() === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

/** Local search draft, pushed to the URL list state after a short debounce */
export function useDebouncedSearch(value: string, commit: (v: string) => void, ms = 250) {
  const [draft, setDraft] = useState(value)
  const commitRef = useRef(commit)
  commitRef.current = commit
  const last = useRef(value)
  useEffect(() => {
    if (draft === last.current) return
    const id = setTimeout(() => {
      last.current = draft
      commitRef.current(draft)
    }, ms)
    return () => clearTimeout(id)
  }, [draft, ms])
  return [draft, setDraft] as const
}

/* ---------------- Image URL field with sample picker ---------------- */

export const SAMPLE_BANNER_IMAGES = [IMAGE_POOL.arab[0], IMAGE_POOL.skinmodel[0], IMAGE_POOL.salon[0], IMAGE_POOL.editorial[0], IMAGE_POOL.skinmodel[1], IMAGE_POOL.perfume[1]]

export function ImageUrlField({ label, value, onChange, error, hint, required, samplesLabel }: { label: ReactNode; value: string; onChange: (v: string) => void; error?: string; hint?: ReactNode; required?: boolean; samplesLabel: string }) {
  return (
    <div className="space-y-2">
      <Input label={label} required={required} value={value} onChange={(e) => onChange(e.target.value.trim())} error={error} hint={hint} dir="ltr" placeholder="https://… or photo-…" spellCheck={false} />
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <span>{samplesLabel}:</span>
        {SAMPLE_BANNER_IMAGES.map((src) => (
          <button key={src} type="button" onClick={() => onChange(src)} aria-label={`${samplesLabel}: ${src}`} aria-pressed={value === src} className={cn('overflow-hidden rounded border transition-colors', value === src ? 'border-ink ring-2 ring-ink/15' : 'border-line hover:border-ink/40')}>
            <Img src={src} alt="" w={96} h={54} className="h-7 w-12" />
          </button>
        ))}
      </div>
    </div>
  )
}
