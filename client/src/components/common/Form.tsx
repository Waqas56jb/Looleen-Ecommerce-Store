import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils'

const fieldBase =
  'w-full rounded-xs border bg-white/80 px-4 text-[15px] text-ink placeholder:text-muted/70 transition-colors duration-200 outline-none focus:border-ink focus:bg-white focus:ring-2 focus:ring-rose/15 disabled:bg-mist disabled:text-muted'

interface FieldWrapProps {
  id: string
  label?: ReactNode
  error?: string
  hint?: ReactNode
  optional?: boolean
  optionalLabel?: string
  children: ReactNode
  className?: string
}

export function FieldWrap({ id, label, error, hint, optional, optionalLabel = 'Optional', children, className }: FieldWrapProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="flex items-baseline justify-between text-[13px] font-medium text-ink">
          <span>{label}</span>
          {optional && <span className="text-xs font-normal text-muted">{optionalLabel}</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  error?: string
  hint?: ReactNode
  optional?: boolean
  optionalLabel?: string
  leading?: ReactNode
  trailing?: ReactNode
  wrapperClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, optional, optionalLabel, leading, trailing, className, wrapperClassName, id, ...rest },
  ref,
) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <FieldWrap id={fid} label={label} error={error} hint={hint} optional={optional} optionalLabel={optionalLabel} className={wrapperClassName}>
      <div className="relative">
        {leading && <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-muted">{leading}</span>}
        <input
          ref={ref}
          id={fid}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
          className={cn(fieldBase, 'h-12', error ? 'border-error' : 'border-line', leading && 'ps-11', trailing && 'pe-11', className)}
          {...rest}
        />
        {trailing && <span className="absolute inset-y-0 end-0 flex items-center pe-3">{trailing}</span>}
      </div>
    </FieldWrap>
  )
})

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode
  error?: string
  hint?: ReactNode
  optional?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, error, hint, optional, className, id, ...rest }, ref) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <FieldWrap id={fid} label={label} error={error} hint={hint} optional={optional}>
      <textarea
        ref={ref}
        id={fid}
        aria-invalid={!!error || undefined}
        className={cn(fieldBase, 'min-h-28 py-3 leading-relaxed', error ? 'border-error' : 'border-line', className)}
        {...rest}
      />
    </FieldWrap>
  )
})

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode
  error?: string
  hint?: ReactNode
  options: { value: string; label: string }[]
  placeholder?: string
  wrapperClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, placeholder, className, wrapperClassName, id, ...rest },
  ref,
) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <FieldWrap id={fid} label={label} error={error} hint={hint} className={wrapperClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={fid}
          aria-invalid={!!error || undefined}
          className={cn(fieldBase, 'h-12 appearance-none pe-10', error ? 'border-error' : 'border-line', className)}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      </div>
    </FieldWrap>
  )
})

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  count?: number
}

export function Checkbox({ label, count, className, id, ...rest }: CheckboxProps) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <label htmlFor={fid} className={cn('group flex cursor-pointer items-center gap-3 py-1.5 text-sm text-ink', className)}>
      <input id={fid} type="checkbox" className="peer sr-only" {...rest} />
      <span
        aria-hidden
        className="grid size-[18px] shrink-0 place-items-center rounded-xs border border-ink/30 bg-white transition-colors peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:ring-2 peer-focus-visible:ring-rose/40 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
      >
        <svg viewBox="0 0 12 12" className="size-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2.5 6.5l2.2 2.2L9.5 3.8" />
        </svg>
      </span>
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-muted">{count}</span>}
    </label>
  )
}

interface RadioCardProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  children: ReactNode
}

/** Large selectable card used for shipping / payment methods */
export function RadioCard({ children, className, checked, ...rest }: RadioCardProps) {
  return (
    <label
      className={cn(
        'relative flex cursor-pointer items-center gap-4 rounded-xs border bg-white p-4 transition-all duration-200 sm:p-5',
        checked ? 'border-ink shadow-soft' : 'border-line hover:border-ink/40',
        className,
      )}
    >
      <input type="radio" className="peer sr-only" checked={checked} {...rest} />
      <span
        aria-hidden
        className={cn(
          'grid size-5 shrink-0 place-items-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-rose/40',
          checked ? 'border-ink' : 'border-ink/30',
        )}
      >
        <span className={cn('size-2.5 rounded-full bg-ink transition-transform', checked ? 'scale-100' : 'scale-0')} />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </label>
  )
}
