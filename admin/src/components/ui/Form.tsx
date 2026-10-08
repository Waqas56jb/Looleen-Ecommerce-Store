import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { useT } from '@/i18n'
import { cn } from '@/utils'

export const fieldClass =
  'w-full rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-subtle transition-colors outline-none focus:border-ink/40 focus:ring-3 focus:ring-rose/12 disabled:bg-mist disabled:text-muted aria-invalid:border-error aria-invalid:focus:ring-error/10'

/* ---------------- Field wrapper ---------------- */

interface FieldProps {
  id?: string
  label?: ReactNode
  required?: boolean
  hint?: ReactNode
  error?: string
  className?: string
  children: ReactNode
  /** Right-aligned extra in the label row (e.g. character counter) */
  aside?: ReactNode
}

export function Field({ id, label, required, hint, error, className, children, aside }: FieldProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {(label || aside) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && (
            <label htmlFor={id} className="text-[13px] font-medium text-ink">
              {label}
              {required && (
                <span className="ms-0.5 text-rose" aria-hidden>
                  *
                </span>
              )}
            </label>
          )}
          {aside && <span className="text-xs text-subtle">{aside}</span>}
        </div>
      )}
      {children}
      {error ? (
        <p id={id ? `${id}-error` : undefined} role="alert" className="text-xs text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={id ? `${id}-hint` : undefined} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/* ---------------- Input ---------------- */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  leading?: ReactNode
  trailing?: ReactNode
  wrapperClassName?: string
  aside?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, leading, trailing, wrapperClassName, className, id, required, aside, ...rest }, ref) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <Field id={fid} label={label} hint={hint} error={error} required={required} className={wrapperClassName} aside={aside}>
      <div className="relative">
        {leading && <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-subtle [&>svg]:size-4">{leading}</span>}
        <input
          ref={ref}
          id={fid}
          required={required}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
          className={cn(fieldClass, 'h-9', leading && 'ps-9', trailing && 'pe-10', className)}
          {...rest}
        />
        {trailing && <span className="absolute inset-y-0 end-0 flex items-center pe-2.5 text-subtle">{trailing}</span>}
      </div>
    </Field>
  )
})

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  wrapperClassName?: string
  aside?: ReactNode
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, hint, error, wrapperClassName, className, id, required, aside, rows = 4, ...rest }, ref) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <Field id={fid} label={label} hint={hint} error={error} required={required} className={wrapperClassName} aside={aside}>
      <textarea ref={ref} id={fid} rows={rows} required={required} aria-invalid={!!error || undefined} className={cn(fieldClass, 'min-h-20 py-2 leading-relaxed', className)} {...rest} />
    </Field>
  )
})

/* ---------------- Select ---------------- */

export interface Option {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  options: Option[]
  placeholder?: string
  wrapperClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, hint, error, options, placeholder, wrapperClassName, className, id, required, ...rest }, ref) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <Field id={fid} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <div className="relative">
        <select ref={ref} id={fid} required={required} aria-invalid={!!error || undefined} className={cn(fieldClass, 'h-9 appearance-none pe-9', className)} {...rest}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
      </div>
    </Field>
  )
})

/* ---------------- Checkbox / Switch / Radio ---------------- */

interface CheckProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
  description?: ReactNode
  indeterminate?: boolean
}

export function Checkbox({ label, description, className, id, indeterminate, ...rest }: CheckProps) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <label htmlFor={fid} className={cn('inline-flex cursor-pointer items-start gap-2.5 text-sm text-ink', rest.disabled && 'cursor-not-allowed opacity-60', className)}>
      <input
        id={fid}
        type="checkbox"
        ref={(el) => {
          if (el) el.indeterminate = !!indeterminate
        }}
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded-[4px] border-line accent-ink"
        {...rest}
      />
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block leading-5">{label}</span>}
          {description && <span className="block text-xs text-muted">{description}</span>}
        </span>
      )}
    </label>
  )
}

interface SwitchProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: ReactNode
  description?: ReactNode
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
  id?: string
}

export function Switch({ checked, onChange, label, description, disabled, size = 'md', className, id }: SwitchProps) {
  const auto = useId()
  const fid = id ?? auto
  const btn = (
    <button
      id={fid}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50',
        size === 'md' ? 'h-5 w-9' : 'h-4 w-7',
        checked ? 'bg-ink' : 'bg-line',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'inline-block rounded-full bg-white shadow transition-transform duration-200',
          size === 'md' ? 'size-4' : 'size-3',
          checked ? (size === 'md' ? 'translate-x-[18px] rtl:-translate-x-[18px]' : 'translate-x-[14px] rtl:-translate-x-[14px]') : 'translate-x-0.5 rtl:-translate-x-0.5',
        )}
      />
    </button>
  )
  if (!label && !description) return btn
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <label htmlFor={fid} className="min-w-0 cursor-pointer">
        {label && <span className="block text-sm font-medium text-ink">{label}</span>}
        {description && <span className="block text-xs text-muted">{description}</span>}
      </label>
      {btn}
    </div>
  )
}

interface RadioGroupProps<V extends string> {
  name: string
  value: V
  onChange: (v: V) => void
  options: { value: V; label: ReactNode; description?: ReactNode }[]
  label?: ReactNode
  direction?: 'row' | 'column'
  variant?: 'plain' | 'card'
}

export function RadioGroup<V extends string>({ name, value, onChange, options, label, direction = 'column', variant = 'plain' }: RadioGroupProps<V>) {
  return (
    <fieldset className="min-w-0">
      {label && <legend className="mb-2 text-[13px] font-medium text-ink">{label}</legend>}
      <div className={cn('flex gap-2', direction === 'column' ? 'flex-col' : 'flex-wrap')}>
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              'flex cursor-pointer items-start gap-2.5 text-sm',
              variant === 'card' && 'rounded-md border p-3 transition-colors',
              variant === 'card' && (value === o.value ? 'border-ink bg-mist' : 'border-line hover:border-ink/30'),
            )}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="mt-0.5 size-4 accent-ink" />
            <span>
              <span className="block leading-5 text-ink">{o.label}</span>
              {o.description && <span className="block text-xs text-muted">{o.description}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/* ---------------- DatePicker (native, styled) ---------------- */

interface DateInputProps extends Omit<InputProps, 'type' | 'value' | 'onChange'> {
  value: string
  onChange: (v: string) => void
  withTime?: boolean
}

/** value as "YYYY-MM-DD" (or "YYYY-MM-DDTHH:mm" with time) */
export function DatePicker({ value, onChange, withTime, ...rest }: DateInputProps) {
  return <Input type={withTime ? 'datetime-local' : 'date'} value={value} onChange={(e) => onChange(e.target.value)} dir="ltr" {...rest} />
}

/* ---------------- SearchInput ---------------- */

export function SearchInput({ value, onChange, placeholder, className, autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; autoFocus?: boolean }) {
  const { t } = useT()
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t('common.searchPlaceholder')}
        aria-label={placeholder ?? t('common.search')}
        className={cn(fieldClass, 'h-9 ps-9 pe-8 [&::-webkit-search-cancel-button]:hidden')}
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label={t('common.clear')} className="absolute end-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-subtle hover:bg-mist hover:text-ink">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

/* ---------------- Form section card ---------------- */

export function FormSection({ title, description, children, className, actions, id }: { title: ReactNode; description?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode; id?: string }) {
  return (
    <section id={id} className={cn('card scroll-mt-24', className)}>
      <header className="flex items-start justify-between gap-4 border-b border-line-soft px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
        </div>
        {actions}
      </header>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  )
}
