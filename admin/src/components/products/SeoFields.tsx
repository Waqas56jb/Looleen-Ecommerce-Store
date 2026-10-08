import { useState } from 'react'
import { X } from 'lucide-react'
import { Field, fieldClass } from '@/components/ui'
import { useT } from '@/i18n'
import { cn } from '@/utils'

/** Comma / Enter separated tag input */
export function KeywordsInput({ id, value, onChange, label, hint, placeholder }: { id: string; value: string[]; onChange: (v: string[]) => void; label: string; hint?: string; placeholder?: string }) {
  const { t } = useT()
  const [draft, setDraft] = useState('')
  const commit = (raw: string) => {
    const parts = raw
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (!parts.length) return
    const next = [...value]
    parts.forEach((p) => !next.some((x) => x.toLowerCase() === p.toLowerCase()) && next.push(p))
    onChange(next)
    setDraft('')
  }
  return (
    <Field id={id} label={label} hint={hint}>
      <div className={cn(fieldClass, 'flex min-h-9 flex-wrap items-center gap-1.5 px-2 py-1.5 focus-within:border-ink/40 focus-within:ring-3 focus-within:ring-rose/12')}>
        {value.map((k) => (
          <span key={k} className="inline-flex h-6 items-center gap-1 rounded bg-mist ps-2 pe-0.5 text-xs text-ink">
            {k}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== k))} aria-label={t('products.form.removeKeyword', { name: k })} className="grid size-5 place-items-center rounded text-muted hover:bg-line hover:text-ink">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          placeholder={value.length ? '' : placeholder}
          onChange={(e) => {
            const v = e.target.value
            if (/[,،]/.test(v)) commit(v)
            else setDraft(v)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit(draft)
            } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
          }}
          onBlur={() => commit(draft)}
          className="h-6 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
        />
      </div>
    </Field>
  )
}

/** Google-style search result preview */
export function SearchPreview({ title, description, slug }: { title: string; description: string; slug: string }) {
  const { t } = useT()
  const shownTitle = title || t('products.form.previewTitleFallback')
  const shownDesc = description || t('products.form.previewDescFallback')
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-ink">{t('products.form.searchPreview')}</p>
      <div className="rounded-md border border-line bg-surface p-4 font-[arial,sans-serif]">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-full border border-line bg-mist text-[10px] font-bold text-ink">LK</span>
          <div className="min-w-0 leading-tight" dir="ltr">
            <p className="text-[13px] text-[#202124]">LOOKS</p>
            <p className="truncate text-xs text-[#188038]">looks.sa/product/{slug || 'product-slug'}</p>
          </div>
        </div>
        <p className="mt-2 line-clamp-1 text-lg leading-snug text-[#1a0dab]">{shownTitle.length > 60 ? `${shownTitle.slice(0, 60)}…` : shownTitle}</p>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#4d5156]">{shownDesc.length > 160 ? `${shownDesc.slice(0, 160)}…` : shownDesc}</p>
      </div>
    </div>
  )
}
