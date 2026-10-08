import { ChevronDown } from 'lucide-react'
import { Button, Checkbox, Dropdown } from '@/components/ui'
import { useT } from '@/i18n'
import { cn } from '@/utils'

interface Props {
  label: string
  options: { value: string; label: string }[]
  value: string[]
  onChange: (v: string[]) => void
  /** Render as a plain checkbox list (mobile drawer) instead of a dropdown */
  inline?: boolean
}

export function MultiCheckFilter({ label, options, value, onChange, inline }: Props) {
  const { t } = useT()
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  const list = (
    <div className={cn(inline ? 'grid grid-cols-2 gap-x-3 gap-y-2.5' : 'max-h-72 space-y-2.5 overflow-y-auto p-3')}>
      {options.map((o) => (
        <Checkbox key={o.value} className="flex" label={o.label} checked={value.includes(o.value)} onChange={() => toggle(o.value)} />
      ))}
      {!inline && value.length > 0 && (
        <button type="button" onClick={() => onChange([])} className="pt-1 text-xs font-medium text-muted hover:text-ink">
          {t('common.clear')}
        </button>
      )}
    </div>
  )
  if (inline)
    return (
      <fieldset className="min-w-0">
        <legend className="mb-2.5 text-[13px] font-medium text-ink">{label}</legend>
        {list}
      </fieldset>
    )
  return (
    <Dropdown
      align="start"
      widthClass="w-60"
      trigger={({ toggle: open, open: isOpen }) => (
        <Button variant="outline" size="md" onClick={open} aria-expanded={isOpen} className={cn('font-normal', value.length > 0 && 'border-ink/40')}>
          {label}
          {value.length > 0 && <span className="rounded bg-ink px-1.5 text-[11px] font-medium text-white tabular-nums">{value.length}</span>}
          <ChevronDown className="size-4 text-subtle" aria-hidden />
        </Button>
      )}
    >
      {list}
    </Dropdown>
  )
}
